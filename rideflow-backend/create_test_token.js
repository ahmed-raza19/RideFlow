const jwt = require('jsonwebtoken');

const testUser = {
  userID: 2,
  role: 'Rider'
};

const token = jwt.sign(testUser, 'DIPLOM@t98', { expiresIn: '1h' });
console.log(token);
