require('dotenv').config();

// PayHero Payment Configuration
const paymentConfig = {
    channelId: process.env.CHANNEL_ID || 1692,                    // Your payment or wallet channel ID
    provider: process.env.PROVIDER || "sasapay",               // Changed to sasapay as per user's discovery
    networkCode: process.env.NETWORK_CODE || "63902",              // Network code (may need adjustment for SasaPay)
    callbackUrl: process.env.CALLBACK_URL || "",                   // OPTIONAL: Callback URL to receive payment json payload on success
    credentialId: process.env.CREDENTIAL_ID || null,                // OPTIONAL: Your custom credential_id
    basicAuthToken: process.env.BASIC_AUTH_TOKEN || "Basic UmF6MUxyQnBKd1FKcVFZQjJRM1o6bVcwSVQ5ZUFuSk5sdWxXbXVxTjI3NG1WZjBydjFhNDNWUElMWEdYcg==",                // Your basic auth token
    successURL: process.env.SUCCESS_URL || null,                  // OPTIONAL: URL to redirect user to if payment is success
    failedURL: process.env.FAILED_URL || null,                   // OPTIONAL: URL to redirect user to if payment fails
    payheroApiUrl: process.env.PAYHERO_API_URL || "https://backend.payhero.co.ke/api/v2"
};

module.exports = paymentConfig;
