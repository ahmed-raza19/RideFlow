const mysql = require('./rideflow-backend/node_modules/mysql2/promise');

async function testDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      database: 'rideflow',
      user: 'root',
      password: 'DIPLOM@t98'
    });

    console.log('✅ Connected to database');

    // Check if tables exist and have data
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM USERS');
    const [drivers] = await connection.execute('SELECT COUNT(*) as count FROM DRIVERS');
    const [rides] = await connection.execute('SELECT COUNT(*) as count FROM RIDES');
    const [payments] = await connection.execute('SELECT COUNT(*) as count FROM PAYMENTS');
    const [complaints] = await connection.execute('SELECT COUNT(*) as count FROM COMPLAINTS');

    console.log(`Users: ${users[0].count}`);
    console.log(`Drivers: ${drivers[0].count}`);
    console.log(`Rides: ${rides[0].count}`);
    console.log(`Payments: ${payments[0].count}`);
    console.log(`Complaints: ${complaints[0].count}`);

    // Get sample data for dashboard
    const [activeDrivers] = await connection.execute(`
      SELECT COUNT(*) as count FROM DRIVERS 
      WHERE AvailabilityStatus = 'Online' AND VerificationStatus = 'Verified'
    `);
    
    const [activeRides] = await connection.execute(`
      SELECT COUNT(*) as count FROM RIDES 
      WHERE RideStatus IN ('Accepted', 'InProgress')
    `);

    const [openComplaints] = await connection.execute(`
      SELECT COUNT(*) as count FROM COMPLAINTS 
      WHERE ComplaintStatus = 'Open'
    `);

    const [totalRevenue] = await connection.execute(`
      SELECT SUM(Amount) as total FROM PAYMENTS 
      WHERE PaymentStatus = 'Paid'
    `);

    console.log('\n--- Dashboard Data ---');
    console.log(`Active Drivers: ${activeDrivers[0].count}`);
    console.log(`Active Rides: ${activeRides[0].count}`);
    console.log(`Open Complaints: ${openComplaints[0].count}`);
    console.log(`Total Revenue: PKR ${totalRevenue[0].total || 0}`);

    await connection.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testDatabase();
