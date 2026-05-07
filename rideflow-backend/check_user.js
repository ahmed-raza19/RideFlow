// Check if user exists and create if needed
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function checkOrCreateUser() {
  try {
    console.log('Checking for user: shunain230@gmail.com');
    
    // Check if user exists
    const [existing] = await db.query('SELECT UserID, Role, AccountStatus FROM USERS WHERE Email = ?', ['shunain230@gmail.com']);
    
    if (existing.length > 0) {
      console.log('✅ User found:', {
        userID: existing[0].UserID,
        role: existing[0].Role,
        status: existing[0].AccountStatus
      });
    } else {
      console.log('❌ User not found, creating new user...');
      
      // Create user with Rider role
      const password = await bcrypt.hash('password123', 12);
      const [result] = await db.query(`
        INSERT INTO USERS (FirstName, LastName, Email, Password, Role, AccountStatus)
        VALUES ('Shunain', 'User', 'shunain230@gmail.com', ?, 'Rider', 'Active')
      `, [password]);
      
      console.log('✅ User created:', {
        userID: result.insertId,
        email: 'shunain230@gmail.com',
        role: 'Rider',
        password: 'password123'
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkOrCreateUser();
