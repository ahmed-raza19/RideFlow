const db = require('./rideflow-backend/config/db');

async function checkUsers() {
  try {
    const [rows] = await db.query('SELECT UserID, FirstName, LastName, Email, Role FROM USERS WHERE Role = "Rider"');
    console.log('Available riders:');
    rows.forEach(user => {
      console.log(`ID: ${user.UserID}, Name: ${user.FirstName} ${user.LastName}, Email: ${user.Email}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
