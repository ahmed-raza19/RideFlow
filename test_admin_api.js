const mysql = require('./rideflow-backend/node_modules/mysql2/promise');

async function testAdminAPI() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      database: 'rideflow',
      user: 'root',
      password: 'DIPLOM@t98'
    });

    console.log('✅ Testing Admin API Data Queries...');

    // Test 1: Revenue Overview Query
    console.log('\n--- Revenue Overview Query ---');
    const [revenueOverview] = await connection.execute(`
      SELECT 
        SUM(p.Amount) AS TotalRevenue,
        COUNT(p.PaymentID) AS TotalTransactions,
        SUM(p.DiscountApplied) AS TotalDiscounts,
        SUM(p.Amount - p.DiscountApplied) AS NetRevenue,
        AVG(p.Amount) AS AverageTransaction,
        MIN(p.TransactionDate) AS FirstTransaction,
        MAX(p.TransactionDate) AS LastTransaction
      FROM PAYMENTS p 
      WHERE p.PaymentStatus = 'Paid'
    `);
    console.log('Revenue Overview:', revenueOverview[0]);

    // Test 2: Active Rides Query
    console.log('\n--- Active Rides Query ---');
    const [activeRides] = await connection.execute(`
      SELECT r.*, 
             CONCAT(ru.FirstName,' ',ru.LastName) AS RiderName,
             CONCAT(du.FirstName,' ',du.LastName) AS DriverName,
             pu.City AS PickupCity, du_loc.City AS DropoffCity,
             v.Make, v.Model, v.LicensePlate
      FROM RIDES r
      JOIN USERS ru ON r.CustomerID = ru.UserID
      LEFT JOIN DRIVERS d ON r.DriverID = d.DriverID
      LEFT JOIN USERS du ON d.UserID = du.UserID
      LEFT JOIN LOCATIONS pu ON r.PickupLocationID = pu.LocationID
      LEFT JOIN LOCATIONS du_loc ON r.DropoffLocationID = du_loc.LocationID
      LEFT JOIN VEHICLES v ON r.VehicleID = v.VehicleID
      WHERE r.RideStatus IN ('Accepted', 'InProgress')
      ORDER BY r.StartTime DESC
    `);
    console.log(`Active Rides: ${activeRides.length}`);
    activeRides.forEach(ride => {
      console.log(`  Ride ${ride.RideID}: ${ride.RiderName} → ${ride.DriverName || 'No Driver'} (${ride.RideStatus})`);
    });

    // Test 3: Drivers Query
    console.log('\n--- Drivers Query ---');
    const [drivers] = await connection.execute(`
      SELECT d.DriverID, CONCAT(u.FirstName,' ',u.LastName) AS DriverName,
             u.Email, u.AccountStatus,
             d.LicenseNumber, d.CNIC, d.VerificationStatus,
             d.AvailabilityStatus, d.WalletBalance, d.CommissionRate,
             l.City AS CurrentCity
      FROM DRIVERS d
      JOIN USERS u ON d.UserID = u.UserID
      LEFT JOIN LOCATIONS l ON d.CurrentLocationID = l.LocationID
      ORDER BY d.VerificationStatus, DriverName
    `);
    console.log(`Total Drivers: ${drivers.length}`);
    drivers.forEach(driver => {
      console.log(`  ${driver.DriverName}: ${driver.VerificationStatus} - ${driver.AvailabilityStatus}`);
    });

    // Test 4: Complaints Query
    console.log('\n--- Open Complaints Query ---');
    const [complaints] = await connection.execute(`
      SELECT c.ComplaintID, c.RideID,
             CONCAT(u.FirstName,' ',u.LastName) AS FiledBy, u.Role,
             c.Description, c.ComplaintStatus, c.CreatedAt
      FROM COMPLAINTS c JOIN USERS u ON c.UserID = u.UserID 
      WHERE c.ComplaintStatus = 'Open'
      ORDER BY c.CreatedAt DESC
    `);
    console.log(`Open Complaints: ${complaints.length}`);
    complaints.forEach(complaint => {
      console.log(`  Complaint ${complaint.ComplaintID}: ${complaint.FiledBy} - ${complaint.Description.substring(0, 50)}...`);
    });

    // Test 5: Revenue by Payment Method
    console.log('\n--- Revenue by Payment Method ---');
    const [revenueByMethod] = await connection.execute(`
      SELECT 
        p.PaymentMethod,
        COUNT(p.PaymentID) AS TransactionCount,
        SUM(p.Amount) AS Revenue,
        ROUND(SUM(p.Amount) * 100.0 / (SELECT SUM(Amount) FROM PAYMENTS WHERE PaymentStatus = 'Paid'), 2) AS Percentage
      FROM PAYMENTS p 
      WHERE p.PaymentStatus = 'Paid'
      GROUP BY p.PaymentMethod
      ORDER BY Revenue DESC
    `);
    console.log('Revenue by Method:');
    revenueByMethod.forEach(method => {
      console.log(`  ${method.PaymentMethod}: PKR ${method.Revenue} (${method.Percentage}%)`);
    });

    // Test 6: Monthly Revenue Trend
    console.log('\n--- Monthly Revenue Trend ---');
    const [monthlyRevenue] = await connection.execute(`
      SELECT 
        DATE_FORMAT(p.TransactionDate, '%Y-%m') AS Month,
        DATE_FORMAT(p.TransactionDate, '%M %Y') AS MonthLabel,
        COUNT(p.PaymentID) AS Transactions,
        SUM(p.Amount) AS Revenue,
        SUM(p.DiscountApplied) AS Discounts
      FROM PAYMENTS p 
      WHERE p.PaymentStatus = 'Paid' 
        AND p.TransactionDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(p.TransactionDate, '%Y-%m'), DATE_FORMAT(p.TransactionDate, '%M %Y')
      ORDER BY Month DESC
    `);
    console.log('Monthly Revenue:');
    monthlyRevenue.forEach(month => {
      console.log(`  ${month.MonthLabel}: PKR ${month.Revenue}`);
    });

    await connection.end();
    console.log('\n✅ Admin API data test completed!');
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testAdminAPI();
