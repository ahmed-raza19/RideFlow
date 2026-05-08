require('dotenv').config({ path: __dirname + '/../.env' });
console.log('JWT Secret:', process.env.JWT_SECRET);

const jwt = require('jsonwebtoken');

const testUser = {
  userID: 2,
  role: 'Rider'
};

const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '1h' });
console.log('Test token:', token);
