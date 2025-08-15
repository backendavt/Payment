// Test script to verify payment amount storage
const axios = require('axios');

const PAYMENT_SERVICE_URL = 'https://payment-omye.onrender.com';

async function testPaymentFlow() {
    try {
        console.log('🧪 Testing Payment Flow...\n');

        // Step 1: Initiate payment
        console.log('1️⃣ Initiating payment...');
        const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/api/process-payment`, {
            customer_name: 'Test User',
            phone_number: '0712345678',
            amount: 100,
            external_reference: 'TEST_DEPOSIT_001'
        });

        console.log('✅ Payment initiated:', paymentResponse.data);
        const reference = paymentResponse.data.reference;

        // Step 2: Check stored payments
        console.log('\n2️⃣ Checking stored payments...');
        const debugResponse = await axios.get(`${PAYMENT_SERVICE_URL}/debug/payments`);
        console.log('📊 Stored payments:', debugResponse.data);

        // Step 3: Check payment status (this should trigger balance update)
        console.log('\n3️⃣ Checking payment status...');
        const statusResponse = await axios.get(`${PAYMENT_SERVICE_URL}/api/check-status?reference=${reference}&phone_number=0712345678`);
        console.log('📋 Payment status:', statusResponse.data);

        // Step 4: Check if payment was cleaned up
        console.log('\n4️⃣ Checking if payment was cleaned up...');
        const finalDebugResponse = await axios.get(`${PAYMENT_SERVICE_URL}/debug/payments`);
        console.log('📊 Final stored payments:', finalDebugResponse.data);

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testPaymentFlow();
