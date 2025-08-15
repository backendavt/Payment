// PayHero Basic Auth Token Generator
// This script helps you generate your Basic Auth token for PayHero API

console.log('🔑 PayHero Basic Auth Token Generator');
console.log('=====================================\n');

// ⚠️  REPLACE THESE WITH YOUR ACTUAL CREDENTIALS ⚠️
const apiUsername = 'Raz1LrBpJwQJqQYB2Q3Z';  // Replace with your actual PayHero username
const apiPassword = 'mW0IT9eAnJNlulWmuqN274mVf0rv1a43VPILXGXr';  // Replace with your actual PayHero password

console.log('📝 Your Credentials:');
console.log(`Username: ${apiUsername}`);
console.log(`Password: ${apiPassword}`);
console.log('');

// Check if credentials are still default
if (apiUsername === 'your_username_here' || apiPassword === 'your_password_here') {
    console.log('❌ ERROR: You need to update the credentials in this file first!');
    console.log('Please edit generate-token.js and replace the placeholder values.');
    console.log('');
    console.log('📋 Steps:');
    console.log('1. Open generate-token.js in a text editor');
    console.log('2. Replace "your_username_here" with your actual PayHero username');
    console.log('3. Replace "your_password_here" with your actual PayHero password');
    console.log('4. Save the file and run this script again');
    process.exit(1);
}

try {
    // Concatenate username and password with colon
    const credentials = apiUsername + ':' + apiPassword;
    
    // Base64 encode the credentials
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    
    // Create the Basic Auth token
    const basicAuthToken = 'Basic ' + encodedCredentials;
    
    console.log('✅ Token Generated Successfully!');
    console.log('================================');
    console.log(`Your Basic Auth Token: ${basicAuthToken}`);
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Copy the token above');
    console.log('2. Open config.js in a text editor');
    console.log('3. Replace the empty basicAuthToken with your token');
    console.log('4. Save config.js');
    console.log('5. Start your payment server with: npm run dev');
    console.log('');
    console.log('🔒 Security Note: Keep your credentials secure and never share them publicly!');
    
} catch (error) {
    console.error('❌ Error generating token:', error.message);
    console.log('');
    console.log('💡 Make sure your credentials contain only valid characters');
}
