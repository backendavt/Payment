// PayHero Payment Frontend Logic - Aviator Style
document.addEventListener('DOMContentLoaded', function() {
    // Payment Configuration (this would typically come from your backend)
    const paymentConfig = {
        successURL: null,  // URL to redirect user to if payment is success
        failedURL: null    // URL to redirect user to if payment fails
    };

    // Add Aviator-style form animations
    initializeFormAnimations();

    // Form submission handler
    document.getElementById('paymentForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        try {
            // Get form data
            const customerName = document.getElementById('customerName').value;
            const phoneNumber = document.getElementById('phoneNumber').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const reference = document.getElementById('reference').value;

            // Disable submit button and show loading state
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';

            // Hide any previous payment status
            document.getElementById('paymentStatus').style.display = 'none';

            // Prepare payment data
            const paymentData = {
                customer_name: customerName,
                phone_number: phoneNumber,
                amount: amount,
                external_reference: reference
            };

            // Process payment and get the API reference
            const apiReference = await processPayment(paymentData);

            if (apiReference) {
                // Show loader with Aviator-style animation
                showLoadingState();
                
                // Start checking payment status
                startPaymentStatusCheck(apiReference);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showErrorAlert('An error occurred during form submission. Please try again.');

            // Reset button state
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-credit-card-fill me-2"></i>Process Payment';
        }
    });

    async function processPayment(paymentData) {
        try {
            // API endpoint (points to our Node.js backend)
            const apiEndpoint = '/api/process-payment';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            try {
                const response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(paymentData),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Payment processing failed');
                }

                console.log('Payment initiated:', data);
                
                // Return the reference for status checking
                return data.reference || data.external_reference || null;

            } catch (error) {
                if (error.name === 'AbortError') {
                    showErrorAlert('The request took too long to process. Please try again.');
                }
                throw error;
            }
        } catch (error) {
            console.error('Payment processing error:', error);
            
            // Reset button state
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-credit-card-fill me-2"></i>Process Payment';
            
            // Show error message
            showErrorAlert('Payment processing failed. Please try again.');
            return null;
        }
    }

    function startPaymentStatusCheck(apiReference) {
        const statusUrl = '/api/check-status';
        let checkStatusInterval;

        // Start periodic checking
        checkStatusInterval = setInterval(async () => {
            try {
                const statusResponse = await fetch(`${statusUrl}?reference=${apiReference}`);
                const statusData = await statusResponse.json();

                console.log('Payment status:', statusData);

                if (statusData.status !== 'QUEUED') {
                    clearInterval(checkStatusInterval);
                    hideLoadingState();

                    // Reset button state
                    const submitBtn = document.getElementById('submitBtn');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-credit-card-fill me-2"></i>Process Payment';

                    let providerReference = statusData.provider_reference || '';

                    if (statusData.status === 'SUCCESS') {
                        showSuccessAlert(`Payment Successful! Reference: ${providerReference}`);
                    } else {
                        showErrorAlert('Payment processing failed.');
                    }
                }
            } catch (error) {
                console.error('Status check error:', error);
            }
        }, 5000);

        // Set a timeout to stop checking after 65 seconds
        setTimeout(() => {
            if (checkStatusInterval) {
                clearInterval(checkStatusInterval);
                hideLoadingState();

                // Reset button state
                const submitBtn = document.getElementById('submitBtn');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-credit-card-fill me-2"></i>Process Payment';

                showWarningAlert('The payment process has timed out. Please try again.');
            }
        }, 65000);

        return apiReference;
    }

    // Aviator-style UI functions
    function initializeFormAnimations() {
        // Add hover effects to form inputs
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });

        // Add button hover effects
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        submitBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    }

    function showLoadingState() {
        const loader = document.getElementById('loader');
        loader.style.display = 'block';
        loader.classList.add('fade-in');
        
        // Add Aviator-style loading animation
        document.body.classList.add('processing-payment');
    }

    function hideLoadingState() {
        const loader = document.getElementById('loader');
        loader.classList.add('fade-out');
        
        setTimeout(() => {
            loader.style.display = 'none';
            loader.classList.remove('fade-out');
        }, 300);
        
        document.body.classList.remove('processing-payment');
    }

    function showSuccessAlert(message) {
        Swal.fire({
            title: '🎉 Payment Successful!',
            text: message,
            icon: 'success',
            background: '#1a1a1a',
            color: '#ffffff',
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Continue',
            showCancelButton: true,
            cancelButtonText: 'Close',
            customClass: {
                popup: 'aviator-swal-popup',
                title: 'aviator-swal-title',
                content: 'aviator-swal-content'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Additional actions after successful payment
                if (paymentConfig.successURL && paymentConfig.successURL.trim() !== '') {
                    window.location.href = paymentConfig.successURL;
                }
            }
        });
    }

    function showErrorAlert(message) {
        Swal.fire({
            title: '❌ Payment Failed',
            text: message,
            icon: 'error',
            background: '#1a1a1a',
            color: '#ffffff',
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'OK',
            customClass: {
                popup: 'aviator-swal-popup',
                title: 'aviator-swal-title',
                content: 'aviator-swal-content'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Additional actions after failed payment
                if (paymentConfig.failedURL && paymentConfig.failedURL.trim() !== '') {
                    window.location.href = paymentConfig.failedURL;
                }
            }
        });
    }

    function showWarningAlert(message) {
        Swal.fire({
            title: '⚠️ Payment Timeout',
            text: message,
            icon: 'warning',
            background: '#1a1a1a',
            color: '#ffffff',
            confirmButtonColor: '#fbbf24',
            confirmButtonText: 'OK',
            customClass: {
                popup: 'aviator-swal-popup',
                title: 'aviator-swal-title',
                content: 'aviator-swal-content'
            }
        });
    }

    function showPaymentStatus(type, message) {
        const statusElement = document.getElementById('paymentStatus');
        statusElement.className = `payment-status alert alert-${type}`;
        statusElement.textContent = message;
        statusElement.style.display = 'block';
        
        // Add Aviator-style animation
        statusElement.classList.add('fade-in');
        
        // Scroll to status message
        statusElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
});

// Add custom CSS for SweetAlert2 to match Aviator theme
const style = document.createElement('style');
style.textContent = `
    .aviator-swal-popup {
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 20px !important;
        backdrop-filter: blur(10px) !important;
    }
    
    .aviator-swal-title {
        color: #fbbf24 !important;
        font-weight: bold !important;
    }
    
    .aviator-swal-content {
        color: rgba(255, 255, 255, 0.9) !important;
    }
    
    .fade-in {
        animation: fadeIn 0.3s ease-in;
    }
    
    .fade-out {
        animation: fadeOut 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
    
    .processing-payment .game-container {
        animation: processing-glow 2s ease-in-out infinite alternate;
    }
    
    @keyframes processing-glow {
        from { box-shadow: inset 0 0 20px rgba(251, 191, 36, 0.1); }
        to { box-shadow: inset 0 0 30px rgba(251, 191, 36, 0.2); }
    }
`;
document.head.appendChild(style);
