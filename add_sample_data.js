const mysql = require('./rideflow-backend/node_modules/mysql2/promise');

async function addSampleData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      database: 'rideflow',
      user: 'root',
      password: 'DIPLOM@t98'
    });

    console.log('✅ Connected to database - Adding sample data...');

    // Add more users
    console.log('Adding more users...');
    await connection.execute(`
      INSERT IGNORE INTO USERS (FirstName, LastName, Email, Password, Role, AccountStatus) VALUES
      ('John', 'Doe', 'john.doe@email.com', '$2b$12$hash1', 'Rider', 'Active'),
      ('Jane', 'Smith', 'jane.smith@email.com', '$2b$12$hash2', 'Rider', 'Active'),
      ('Mike', 'Wilson', 'mike.wilson@email.com', '$2b$12$hash3', 'Rider', 'Active'),
      ('Sarah', 'Johnson', 'sarah.j@email.com', '$2b$12$hash4', 'Rider', 'Active'),
      ('David', 'Lee', 'david.lee@email.com', '$2b$12$hash5', 'Driver', 'Active'),
      ('Tom', 'Brown', 'tom.brown@email.com', '$2b$12$hash6', 'Driver', 'Active')
    `);

    // Add more drivers
    console.log('Adding more drivers...');
    await connection.execute(`
      INSERT IGNORE INTO DRIVERS (UserID, LicenseNumber, CNIC, VerificationStatus, AvailabilityStatus, WalletBalance, CommissionRate, CurrentLocationID) VALUES
      (22, 'KHI-2023-01123', '42301-9876543-1', 'Verified', 'Online', 850.00, 10.00, 1),
      (23, 'LHR-2023-01456', '35201-1234567-8', 'Verified', 'Online', 1200.00, 12.00, 2),
      (24, 'ISB-2023-01789', '61101-5555555-9', 'Verified', 'Offline', 600.00, 10.00, 3)
    `);

    // Add more rides with different statuses
    console.log('Adding more rides...');
    await connection.execute(`
      INSERT IGNORE INTO RIDES (CustomerID, DriverID, VehicleID, PickupLocationID, DropoffLocationID, RideStatus, Fare, Distance, StartTime, EndTime, SurgeMultiplier) VALUES
      (21, 22, 2, 1, 2, 'Completed', 450.00, 18.50, '2026-05-01 10:00:00', '2026-05-01 10:40:00', 1.00),
      (21, 23, 3, 3, 4, 'Completed', 280.00, 11.20, '2026-05-02 15:30:00', '2026-05-02 15:58:00', 1.00),
      (22, 22, 2, 5, 6, 'Completed', 150.00, 6.80, '2026-05-03 09:15:00', '2026-05-03 09:35:00', 1.00),
      (23, 23, 3, 7, 8, 'InProgress', 320.00, 14.00, '2026-05-04 14:00:00', NULL, 1.50),
      (24, 24, 4, 9, 10, 'Accepted', 180.00, 8.50, NULL, NULL, 1.00),
      (21, 22, 2, 11, 12, 'Requested', 0.00, NULL, NULL, NULL, 1.00)
    `);

    // Add more payments
    console.log('Adding more payments...');
    await connection.execute(`
      INSERT IGNORE INTO PAYMENTS (RideID, CustomerID, Amount, PaymentMethod, PaymentStatus, DiscountApplied, TransactionDate) VALUES
      (3, 21, 450.00, 'CreditCard', 'Paid', 0.00, '2026-05-01 10:45:00'),
      (4, 21, 280.00, 'Wallet', 'Paid', 0.00, '2026-05-02 16:00:00'),
      (5, 22, 150.00, 'Cash', 'Paid', 0.00, '2026-05-03 09:40:00'),
      (7, 23, 320.00, 'CreditCard', 'Paid', 0.00, '2026-05-04 14:30:00')
    `);

    // Add more complaints
    console.log('Adding more complaints...');
    await connection.execute(`
      INSERT IGNORE INTO COMPLAINTS (RideID, UserID, Description, ComplaintStatus) VALUES
      (3, 21, 'Driver was talking on phone during ride', 'Open'),
      (4, 21, 'Great service, driver was very professional', 'Resolved'),
      (5, 22, 'Car was not clean', 'Open'),
      (7, 23, 'Driver took wrong route', 'Open')
    `);

    // Update some drivers to be online
    await connection.execute(`
      UPDATE DRIVERS SET AvailabilityStatus = 'Online' 
      WHERE VerificationStatus = 'Verified'
    `);

    // Verify the data
    console.log('\n--- Updated Data Summary ---');
    
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM USERS');
    const [drivers] = await connection.execute('SELECT COUNT(*) as count FROM DRIVERS');
    const [rides] = await connection.execute('SELECT COUNT(*) as count FROM RIDES');
    const [payments] = await connection.execute('SELECT COUNT(*) as count FROM PAYMENTS');
    const [complaints] = await connection.execute('SELECT COUNT(*) as count FROM COMPLAINTS');

    const [totalRevenue] = await connection.execute(`
      SELECT SUM(Amount) as total FROM PAYMENTS 
      WHERE PaymentStatus = 'Paid'
    `);
    
    const [activeRides] = await connection.execute(`
      SELECT COUNT(*) as count FROM RIDES 
      WHERE RideStatus IN ('Accepted', 'InProgress')
    `);

    const [activeDrivers] = await connection.execute(`
      SELECT COUNT(*) as count FROM DRIVERS 
      WHERE AvailabilityStatus = 'Online' AND VerificationStatus = 'Verified'
    `);

    const [openComplaints] = await connection.execute(`
      SELECT COUNT(*) as count FROM COMPLAINTS 
      WHERE ComplaintStatus = 'Open'
    `);

    console.log(`Users: ${users[0].count}`);
    console.log(`Drivers: ${drivers[0].count}`);
    console.log(`Rides: ${rides[0].count}`);
    console.log(`Payments: ${payments[0].count}`);
    console.log(`Complaints: ${complaints[0].count}`);
    console.log(`Total Revenue: PKR ${totalRevenue[0].total || 0}`);
    console.log(`Active Rides: ${activeRides[0].count}`);
    console.log(`Active Drivers: ${activeDrivers[0].count}`);
    console.log(`Open Complaints: ${openComplaints[0].count}`);

    await connection.end();
    console.log('✅ Sample data added successfully!');
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

addSampleData();
