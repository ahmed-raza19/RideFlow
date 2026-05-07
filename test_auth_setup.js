// Test script to create users and verify authentication
const bcrypt = require('bcryptjs');
const db = require('./rideflow-backend/config/db');

async function createTestUsers() {
  try {
    console.log('Creating test users...');
    
    // Create Admin user (manually - admins can't register via API)
    const adminPassword = await bcrypt.hash('admin123', 12);
    await db.query(`
      INSERT IGNORE INTO USERS (FirstName, LastName, Email, Password, Role, AccountStatus)
      VALUES ('Admin', 'User', 'admin@rideflow.com', ?, 'Admin', 'Active')
    `, [adminPassword]);
    
    // Create Rider user
    const riderPassword = await bcrypt.hash('rider123', 12);
    await db.query(`
      INSERT IGNORE INTO USERS (FirstName, LastName, Email, Password, Role, AccountStatus)
      VALUES ('Test', 'Rider', 'rider@rideflow.com', ?, 'Rider', 'Active')
    `, [riderPassword]);
    
    // Create Driver user
    const driverPassword = await bcrypt.hash('driver123', 12);
    await db.query(`
      INSERT IGNORE INTO USERS (FirstName, LastName, Email, Password, Role, AccountStatus)
      VALUES ('Test', 'Driver', 'driver@rideflow.com', ?, 'Driver', 'Active')
    `, [driverPassword]);
    
    // Add driver profile for the driver
    const [driverResult] = await db.query('SELECT UserID FROM USERS WHERE Email = ?', ['driver@rideflow.com']);
    if (driverResult.length > 0) {
      await db.query(`
        INSERT IGNORE INTO DRIVERS (UserID, LicenseNumber, CNIC)
        VALUES (?, 'LIC-123456', 'CNIC-1234567890')
      `, [driverResult[0].UserID]);
    }
    
    console.log('✅ Test users created:');
    console.log('  Admin: admin@rideflow.com / admin123');
    console.log('  Rider: rider@rideflow.com / rider123');
    console.log('  Driver: driver@rideflow.com / driver123');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    process.exit();
  }
}

createTestUsers();
