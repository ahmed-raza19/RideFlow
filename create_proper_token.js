const mysql = require('./rideflow-backend/node_modules/mysql2/promise');
const jwt = require('./rideflow-backend/node_modules/jsonwebtoken');

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

    // Use the correct JWT secret from the .env file
    const jwtSecret = 'a_long_random_secret_for_jwt_session';
    console.log(`Using JWT Secret: ${jwtSecret}`);

    // Find an admin user
    const [adminUsers] = await connection.execute(`
      SELECT * FROM USERS WHERE Role = 'Admin' LIMIT 1
    `);

    if (adminUsers.length === 0) {
      console.log('No admin user found, creating one...');
      const [result] = await connection.execute(`
        INSERT INTO USERS (FirstName, LastName, Email, Password, Role, AccountStatus) 
        VALUES ('Admin', 'User', 'admin@rideflow.pk', '$2b$12$hashedpassword', 'Admin', 'Active')
      `);
      
      const [newAdmin] = await connection.execute(`
        SELECT * FROM USERS WHERE Role = 'Admin' LIMIT 1
      `);
      
      const adminUser = newAdmin[0];
      const token = jwt.sign(
        { 
          userId: adminUser.UserID,  // Changed from userID to userId
          email: adminUser.Email, 
          role: adminUser.Role 
        },
        jwtSecret,
        { expiresIn: '24h' }
      );
      
      console.log('Created admin user and token:');
      console.log(`User ID: ${adminUser.UserID}`);
      console.log(`Email: ${adminUser.Email}`);
      console.log(`Token: ${token}`);
    } else {
      const adminUser = adminUsers[0];
      const token = jwt.sign(
        { 
          userId: adminUser.UserID,  // Changed from userID to userId
          email: adminUser.Email, 
          role: adminUser.Role 
        },
        jwtSecret,
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
