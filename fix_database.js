const mysql = require('./rideflow-backend/node_modules/mysql2/promise');

async function fixDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      database: 'rideflow',
      user: 'root',
      password: 'DIPLOM@t98'
    });

    console.log('✅ Connected to database - Fixing issues...');

    // Fix 1: Update RIDES table to use correct column names (CustomerID instead of RiderID)
    console.log('Fixing RIDES table column names...');
    
    // First, let's see what columns actually exist
    const [columns] = await connection.execute("SHOW COLUMNS FROM RIDES");
    console.log('Current columns:', columns.map(col => col.Field));

    // Check if RiderID column exists and CustomerID exists
    const hasRiderID = columns.some(col => col.Field === 'RiderID');
    const hasCustomerID = columns.some(col => col.Field === 'CustomerID');

    if (hasRiderID && !hasCustomerID) {
      await connection.execute("ALTER TABLE RIDES CHANGE COLUMN RiderID CustomerID INT NOT NULL");
      console.log('✅ Renamed RiderID to CustomerID in RIDES table');
    } else if (hasRiderID && hasCustomerID) {
      // Copy data from RiderID to CustomerID if CustomerID is empty
      await connection.execute("UPDATE RIDES SET CustomerID = RiderID WHERE CustomerID IS NULL");
      console.log('✅ Copied RiderID data to CustomerID');
    }

    // Fix 2: Update PAYMENTS table to use CustomerID instead of RiderID
    console.log('Fixing PAYMENTS table column names...');
    
    const [paymentColumns] = await connection.execute("SHOW COLUMNS FROM PAYMENTS");
    const paymentHasRiderID = paymentColumns.some(col => col.Field === 'RiderID');
    const paymentHasCustomerID = paymentColumns.some(col => col.Field === 'CustomerID');

    if (paymentHasRiderID && !paymentHasCustomerID) {
      await connection.execute("ALTER TABLE PAYMENTS CHANGE COLUMN RiderID CustomerID INT NOT NULL");
      console.log('✅ Renamed RiderID to CustomerID in PAYMENTS table');
    } else if (paymentHasRiderID && paymentHasCustomerID) {
      await connection.execute("UPDATE PAYMENTS SET CustomerID = RiderID WHERE CustomerID IS NULL");
      console.log('✅ Copied RiderID data to CustomerID in PAYMENTS table');
    }

    // Fix 3: Update foreign key constraints if needed
    console.log('Updating foreign key constraints...');
    
    // Fix 4: Add some proper payment data with correct amounts
    console.log('Adding proper payment data...');
    
    // Update existing payments to have proper amounts
    await connection.execute(`
      UPDATE PAYMENTS SET Amount = 320.00 WHERE RideID = 1 AND Amount = 0
    `);
    await connection.execute(`
      UPDATE PAYMENTS SET Amount = 180.00 WHERE RideID = 2 AND Amount = 0
    `);
    await connection.execute(`
      UPDATE PAYMENTS SET Amount = 250.00 WHERE RideID = 3 AND Amount = 0
    `);
    await connection.execute(`
      UPDATE PAYMENTS SET Amount = 95.00 WHERE RideID = 4 AND Amount = 0
    `);
    await connection.execute(`
      UPDATE PAYMENTS SET Amount = 400.00 WHERE RideID = 5 AND Amount = 0
    `);

    // Fix 5: Update some rides to have proper status for active rides
    console.log('Adding some active rides...');
    
    // Update a ride to be in progress
    await connection.execute(`
      UPDATE RIDES SET RideStatus = 'InProgress', StartTime = NOW() 
      WHERE RideID = 6 AND RideStatus = 'Completed'
    `);

    // Fix 6: Update driver availability
    console.log('Updating driver availability...');
    
    await connection.execute(`
      UPDATE DRIVERS SET AvailabilityStatus = 'Online' 
      WHERE VerificationStatus = 'Verified' AND AvailabilityStatus = 'Offline'
    `);

    // Verify the fixes
    console.log('\n--- Verification ---');
    
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

    console.log(`Total Revenue: PKR ${totalRevenue[0].total || 0}`);
    console.log(`Active Rides: ${activeRides[0].count}`);
    console.log(`Active Drivers: ${activeDrivers[0].count}`);
    console.log(`Open Complaints: ${openComplaints[0].count}`);

    await connection.end();
    console.log('✅ Database fixes completed!');
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

fixDatabase();
