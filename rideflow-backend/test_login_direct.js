const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login API directly...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test.driver@rideflow.com',
      password: 'driver123'
    });
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testLogin();
