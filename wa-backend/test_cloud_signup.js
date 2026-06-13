const axios = require('axios');

async function testCloudRunSignup() {
  const url = 'https://wa-backend-536473631781.us-central1.run.app/api/auth/signup';
  const payload = {
    email: `test_user_${Date.now()}@example.com`,
    password: 'password123',
    fullName: 'Test Candidate',
    phoneNumber: '1234567890'
  };

  try {
    console.log(`Sending sign up request to ${url}...`);
    const response = await axios.post(url, payload);
    console.log('✅ SIGN UP SUCCESSFUL! Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ SIGN UP FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testCloudRunSignup();
