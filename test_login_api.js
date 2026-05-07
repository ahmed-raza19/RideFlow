// Test script to verify login API endpoints
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testLoginEndpoints() {
  try {
    console.log('🧪 Testing login endpoints...\n');

    // Test Admin login
    console.log('1. Testing Admin login...');
    const adminResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@rideflow.com',
      password: 'admin123'
    });
    console.log('✅ Admin login successful:', {
      role: adminResponse.data.data.user.role,
      userID: adminResponse.data.data.user.userID
    });

    // Test Rider login
    console.log('\n2. Testing Rider login...');
    const riderResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'rider@rideflow.com',
      password: 'rider123'
    });
    console.log('✅ Rider login successful:', {
      role: riderResponse.data.data.user.role,
      userID: riderResponse.data.data.user.userID
    });

    // Test Driver login
    console.log('\n3. Testing Driver login...');
    const driverResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'driver@rideflow.com',
      password: 'driver123'
    });
    console.log('✅ Driver login successful:', {
      role: driverResponse.data.data.user.role,
      userID: driverResponse.data.data.user.userID,
      driverID: driverResponse.data.data.user.driverID
    });

    console.log('\n🎉 All login tests passed! Frontend can now authenticate users.');

  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data || error.message);
  }
}

testLoginEndpoints();
