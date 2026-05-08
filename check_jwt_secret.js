require('dotenv').config({ path: './rideflow-backend/.env' });
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('SECRET_KEY from env:', process.env.SECRET_KEY);

// Also check if there's a hardcoded value
const fs = require('fs');
try {
  const serverJs = fs.readFileSync('./rideflow-backend/server.js', 'utf8');
  if (serverJs.includes('JWT_SECRET')) {
    console.log('Found JWT_SECRET in server.js');
  }
} catch (e) {
  console.log('Could not read server.js');
}
