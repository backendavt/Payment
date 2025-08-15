const express = require('express');
const axios = require('axios');
const paymentConfig = require('../config');
const supabase = require('../supabase');

const router = express.Router();

// In-memory store for payment amounts (in production, use Redis or database)
const paymentStore = new Map();

// Clean up old payment records every hour
setInterval(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    for (const [reference, details] of paymentStore.entries()) {
        if (new Date(details.timestamp) < oneHourAgo) {
            paymentStore.delete(reference);
            console.log(`🧹 Cleaned up old payment record: ${reference}`);
        }
    }
}, 60 * 60 * 1000); // Run every hour

// Process Payment
router.post('/process-payment', async (req, res) => {
    try {
        const {
            customer_name,
            phone_number,
            amount,
            external_reference
        } = req.body;

        console.log('🔍 Payment Request Details:');
        console.log('Customer Name:', customer_name);
        console.log('Phone Number:', phone_number);
        console.log('Amount:', amount);
        console.log('Reference:', external_reference);
        console.log('Channel ID:', paymentConfig.channelId);
        console.log('Provider:', paymentConfig.provider);
        console.log('Network Code:', paymentConfig.networkCode);
        console.log('');

        // Validate required fields
        if (!customer_name || !phone_number || !amount || !external_reference) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: customer_name, phone_number, amount, external_reference'
            });
        }

        // Validate phone number format (Kenya M-Pesa format)
        if (!/^07\d{8}$/.test(phone_number)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid phone number format. Must start with 07 and be 10 digits'
            });
        }

        // Validate amount
        if (amount <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Amount must be greater than 0'
            });
        }

        // Prepare payment data for PayHero API (matching PHP exactly - NULL for credential_id)
        const paymentData = {
            customer_name,
            phone_number,
            amount: amount,                    // Remove parseFloat() - match PHP
            external_reference,
            channel_id: paymentConfig.channelId,
            provider: paymentConfig.provider,
            network_code: paymentConfig.networkCode,
            callback_url: paymentConfig.callbackUrl || "",    // Empty string instead of null
            credential_id: paymentConfig.credentialId || null     // NULL value (matches PHP exactly!)
        };

        console.log('📤 Sending to PayHero API:');
        console.log('API URL:', `${paymentConfig.payheroApiUrl}/payments`);
        console.log('Payment Data:', JSON.stringify(paymentData, null, 2));
        console.log('Auth Token:', paymentConfig.basicAuthToken.substring(0, 20) + '...');
        console.log('');

        // Make request to PayHero API (no timeout - match PHP exactly)
        const response = await axios.post(
            `${paymentConfig.payheroApiUrl}/payments`,
            paymentData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': paymentConfig.basicAuthToken
                }
                // No timeout - matches PHP's CURLOPT_TIMEOUT => 0 behavior
            }
        );

        console.log('✅ PayHero API Response:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
        console.log('');

        // Store payment amount for balance update later
        if (response.data.reference) {
            const paymentData = {
                amount: parseFloat(amount),
                phone_number: phone_number,
                customer_name: customer_name,
                timestamp: new Date().toISOString()
            };
            paymentStore.set(response.data.reference, paymentData);
            console.log(`💰 Stored payment details for reference: ${response.data.reference}:`, paymentData);
            console.log(`📊 Total stored payments: ${paymentStore.size}`);
        }

        res.status(200).json(response.data);

    } catch (error) {
        console.error('❌ Payment Processing Error:');
        console.error('Error Type:', error.constructor.name);
        console.error('Error Message:', error.message);
        
        if (error.response) {
            console.error('PayHero API Error Response:');
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        
        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                status: 'error',
                message: 'Request timeout. Please try again.'
            });
        }

        if (error.response) {
            // PayHero API returned an error response
            return res.status(error.response.status).json({
                status: 'error',
                message: error.response.data?.message || 'Payment processing failed',
                details: error.response.data
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error during payment processing'
        });
    }
});

// Check Payment Status and Update Balance
router.get('/check-status', async (req, res) => {
    try {
        const { reference, phone_number } = req.query;

        if (!reference) {
            return res.status(400).json({
                status: 'error',
                message: 'Reference parameter is required'
            });
        }

        // Make request to PayHero API to check status (no timeout - match PHP)
        const response = await axios.get(
            `${paymentConfig.payheroApiUrl}/transaction-status?reference=${encodeURIComponent(reference)}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': paymentConfig.basicAuthToken
                }
                // No timeout - matches PHP behavior
            }
        );

        console.log('Payment status retrieved:', response.data);
        
        // If payment is successful, update user balance in database
        if (response.data.status === 'SUCCESS' && phone_number) {
            try {
                // Get the stored payment amount
                const paymentDetails = paymentStore.get(reference);
                if (paymentDetails && paymentDetails.amount > 0) {
                    await updateUserBalance(phone_number, paymentDetails.amount, reference);
                    console.log('✅ User balance updated successfully for payment:', reference, 'Amount:', paymentDetails.amount);
                    
                    // Clean up stored payment details after successful balance update
                    paymentStore.delete(reference);
                } else {
                    console.log('⚠️ Payment amount not found for reference:', reference);
                    console.log('Available payments:', Array.from(paymentStore.keys()));
                }
            } catch (balanceError) {
                console.error('❌ Error updating user balance:', balanceError);
                // Don't fail the status check, just log the error
            }
        }

        res.status(200).json(response.data);

    } catch (error) {
        console.error('Status check error:', error);

        if (error.code === 'ECONNABORTED') {
            return res.status(408).json({
                status: 'error',
                message: 'Request timeout while checking status'
            });
        }

        if (error.response) {
            // PayHero API returned an error response
            return res.status(error.response.status).json({
                status: 'error',
                message: error.response.data?.message || 'Failed to check payment status',
                details: error.response.data
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error while checking payment status'
        });
    }
});

// Function to update user balance in database
async function updateUserBalance(phoneNumber, amount, reference) {
    try {
        console.log(`💰 Updating balance for phone: ${phoneNumber}, amount: ${amount}, reference: ${reference}`);
        
        // First, get the current user balance
        const { data: userData, error: fetchError } = await supabase
            .from('users')
            .select('id, balance')
            .eq('phone', phoneNumber)
            .single();

        if (fetchError) {
            console.error('❌ Error fetching user:', fetchError);
            throw new Error('User not found');
        }

        if (!userData) {
            console.error('❌ User not found with phone:', phoneNumber);
            throw new Error('User not found');
        }

        const currentBalance = userData.balance || 0;
        const newBalance = currentBalance + parseFloat(amount);

        console.log(`💰 Balance update: ${currentBalance} + ${amount} = ${newBalance}`);

        // Update the user's balance
        const { error: updateError } = await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('id', userData.id);

        if (updateError) {
            console.error('❌ Error updating balance:', updateError);
            throw new Error('Failed to update balance');
        }

        // Log the transaction (optional - you can create a transactions table)
        console.log(`✅ Balance updated successfully: ${currentBalance} → ${newBalance}`);

        return { success: true, oldBalance: currentBalance, newBalance };

    } catch (error) {
        console.error('❌ Error in updateUserBalance:', error);
        throw error;
    }
}

// Debug endpoint to see stored payments
router.get('/debug/payments', (req, res) => {
    try {
        const payments = Array.from(paymentStore.entries()).map(([reference, details]) => ({
            reference,
            ...details
        }));
        
        res.json({
            total_payments: paymentStore.size,
            payments: payments
        });
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Webhook endpoint for PayHero callbacks (optional)
router.post('/webhook', (req, res) => {
    try {
        const webhookData = req.body;
        console.log('Webhook received:', webhookData);

        // Process the webhook data as needed
        // You can store it in a database, trigger other actions, etc.

        // Always respond with 200 to acknowledge receipt
        res.status(200).json({ status: 'received' });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ status: 'error' });
    }
});

module.exports = router;
