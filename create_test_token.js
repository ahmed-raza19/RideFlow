const jwt = require('jsonwebtoken');

// Create a test rider token
const testUser = {
  userID: 2, // Using a rider ID from the seed data
  role: 'Rider'
};

const token = jwt.sign(testUser, 'DIPLOM@t98', { expiresIn: '1h' });
console.log('Test rider token:');
console.log(token);
console.log('\nUse this token in Authorization header as: Bearer ' + token);
