// Test login for specific user
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testSpecificUser() {
  try {
    console.log('🧪 Testing login for shunain230@gmail.com...\n');

    // Try with common passwords
    const passwords = ['password123', 'password', '123456', 'rider123'];
    
    for (const password of passwords) {
      console.log(`Testing password: ${password}`);
      
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: 'shunain230@gmail.com',
          password: password
        });
        
        if (res.data.success) {
          console.log('✅ LOGIN SUCCESSFUL!');
          console.log('Password:', password);
          console.log('User data:', res.data.data.user);
          console.log('Token:', res.data.data.token.substring(0, 50) + '...');
          console.log('Expected redirect:', `/${res.data.data.user.role.toLowerCase()}`);
          return;
        }
      } catch (err) {
        if (err.response?.status === 401) {
          console.log('❌ Invalid password');
        } else {
          console.log('❌ Error:', err.response?.data?.error || err.message);
        }
      }
    }
    
    console.log('\n❌ None of the common passwords worked.');
    console.log('💡 You may need to use the correct password for this account.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSpecificUser();
