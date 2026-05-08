// Test if frontend can access backend API
const axios = require('axios');

const testAPI = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/rider/locations', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjIxLCJlbWFpbCI6InRlc3QucmlkZXJAcmlkZWZsb3cuY29tIiwicm9sZSI6IlJpZGVyIiwiaWF0IjoxNzc4MjYyNDU5LCJleHAiOjE3NzgzNDg4NTl9.WhNb1ROsz-v8kNavR-t_J9wwwC1Jx-6Dz52qKA7VEcA'
      }
    });
    
    console.log('✅ API Test Successful');
    console.log('Response:', response.data);
    console.log('Locations count:', response.data.data?.length);
  } catch (error) {
    console.error('❌ API Test Failed:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

testAPI();
