require('dotenv').config({ path: __dirname + '/../.env' });
const jwt = require('jsonwebtoken');

const testUser = {
  userID: 21,
  email: 'test.rider@rideflow.com',
  role: 'Rider'
};

const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '24h' });
console.log('Rider token for user 21:');
console.log(token);
