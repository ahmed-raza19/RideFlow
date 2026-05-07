// Reset password for shunain230@gmail.com
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function resetPassword() {
  try {
    console.log('Resetting password for shunain230@gmail.com...');
    
    const newPassword = await bcrypt.hash('rider123', 12);
    
    await db.query('UPDATE USERS SET Password = ? WHERE Email = ?', [newPassword, 'shunain230@gmail.com']);
    
    console.log('✅ Password reset successfully!');
    console.log('Email: shunain230@gmail.com');
    console.log('New Password: rider123');
    console.log('Role: Rider');
    console.log('Expected redirect: /rider');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

resetPassword();
