// Test script to simulate the complete login flow
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testCompleteLoginFlow() {
  try {
    console.log('🧪 Testing complete login flow...\n');

    // Test 1: Admin login
    console.log('1. Testing Admin login...');
    const adminResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@rideflow.com',
      password: 'admin123'
    });
    
    if (adminResponse.data.success) {
      console.log('✅ Admin login successful');
      console.log('   - Token:', adminResponse.data.data.token.substring(0, 20) + '...');
      console.log('   - User Role:', adminResponse.data.data.user.role);
      console.log('   - Expected Redirect:', `/${adminResponse.data.data.user.role.toLowerCase()}`);
    }

    // Test 2: Rider login
    console.log('\n2. Testing Rider login...');
    const riderResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'rider@rideflow.com',
      password: 'rider123'
    });
    
    if (riderResponse.data.success) {
      console.log('✅ Rider login successful');
      console.log('   - Token:', riderResponse.data.data.token.substring(0, 20) + '...');
      console.log('   - User Role:', riderResponse.data.data.user.role);
      console.log('   - Expected Redirect:', `/${riderResponse.data.data.user.role.toLowerCase()}`);
    }

    // Test 3: Driver login
    console.log('\n3. Testing Driver login...');
    const driverResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'driver@rideflow.com',
      password: 'driver123'
    });
    
    if (driverResponse.data.success) {
      console.log('✅ Driver login successful');
      console.log('   - Token:', driverResponse.data.data.token.substring(0, 20) + '...');
      console.log('   - User Role:', driverResponse.data.data.user.role);
      console.log('   - Driver ID:', driverResponse.data.data.user.driverID);
      console.log('   - Expected Redirect:', `/${driverResponse.data.data.user.role.toLowerCase()}`);
    }

    console.log('\n🎉 Backend authentication is working correctly!');
    console.log('📝 Expected frontend behavior:');
    console.log('   - Admin login → /admin');
    console.log('   - Rider login → /rider');
    console.log('   - Driver login → /driver');

  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data || error.message);
  }
}

testCompleteLoginFlow();
