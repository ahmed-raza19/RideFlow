const mysql = require('./rideflow-backend/node_modules/mysql2/promise');
const jwt = require('./rideflow-backend/node_modules/jsonwebtoken');
require('dotenv').config({ path: './rideflow-backend/.env' });

async function createAdminToken() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      database: 'rideflow',
      user: 'root',
      password: 'DIPLOM@t98'
    });

    console.log('✅ Connected to database - Creating admin token...');
    console.log(`JWT Secret: ${process.env.JWT_SECRET}`);

    // Find an admin user
    const [adminUsers] = await connection.execute(`
      SELECT * FROM USERS WHERE Role = 'Admin' LIMIT 1
    `);

    if (adminUsers.length === 0) {
      console.log('No admin user found, creating one...');
      await connection.execute(`
        INSERT INTO USERS (FirstName, LastName, Email, Password, Role, AccountStatus) 
        VALUES ('Admin', 'User', 'admin@rideflow.pk', '$2b$12$hashedpassword', 'Admin', 'Active')
      `);
      
      const [newAdmin] = await connection.execute(`
        SELECT * FROM USERS WHERE Role = 'Admin' LIMIT 1
      `);
      
      const adminUser = newAdmin[0];
      const token = jwt.sign(
        { userId: adminUser.UserID, email: adminUser.Email, role: adminUser.Role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );
      
      console.log('Created admin user and token:');
      console.log(`User ID: ${adminUser.UserID}`);
      console.log(`Email: ${adminUser.Email}`);
      console.log(`Token: ${token}`);
    } else {
      const adminUser = adminUsers[0];
      const token = jwt.sign(
        { userId: adminUser.UserID, email: adminUser.Email, role: adminUser.Role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );
      
      console.log('Found existing admin user:');
      console.log(`User ID: ${adminUser.UserID}`);
      console.log(`Email: ${adminUser.Email}`);
      console.log(`Token: ${token}`);
    }

    await connection.end();
    console.log('✅ Admin token created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAdminToken();
