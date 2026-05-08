const express = require('express');
const cors = require('cors');
const mysql = require('./rideflow-backend/node_modules/mysql2/promise');

async function createTestServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Database connection
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    database: 'rideflow',
    user: 'root',
    password: 'DIPLOM@t98'
  });

  console.log('✅ Test server connected to database');

  // Revenue Overview endpoint (copy from adminController)
  app.get('/test/admin/revenue/overview', async (req, res) => {
    try {
      const { from, to } = req.query;
      
      let dateFilter = '';
      const params = [];
      if (from && to) {
        dateFilter = 'AND p.TransactionDate BETWEEN ? AND ?';
        params.push(from, to);
      }
      
      // Total revenue from all completed rides
      const [totalRevenue] = await connection.execute(`
        SELECT 
          SUM(p.Amount) AS TotalRevenue,
          COUNT(p.PaymentID) AS TotalTransactions,
          SUM(p.DiscountApplied) AS TotalDiscounts,
          SUM(p.Amount - p.DiscountApplied) AS NetRevenue,
          AVG(p.Amount) AS AverageTransaction,
          MIN(p.TransactionDate) AS FirstTransaction,
          MAX(p.TransactionDate) AS LastTransaction
        FROM PAYMENTS p 
        WHERE p.PaymentStatus = 'Paid' ${dateFilter}
      `, params);
      
      // Revenue by payment method
      const [revenueByMethod] = await connection.execute(`
        SELECT 
          p.PaymentMethod,
          COUNT(p.PaymentID) AS TransactionCount,
          SUM(p.Amount) AS Revenue,
          ROUND(SUM(p.Amount) * 100.0 / (SELECT SUM(Amount) FROM PAYMENTS WHERE PaymentStatus = 'Paid' ${dateFilter}), 2) AS Percentage
        FROM PAYMENTS p 
        WHERE p.PaymentStatus = 'Paid' ${dateFilter}
        GROUP BY p.PaymentMethod
        ORDER BY Revenue DESC
      `, params);
      
      // Revenue by month (last 12 months)
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
          ${dateFilter}
        GROUP BY DATE_FORMAT(p.TransactionDate, '%Y-%m'), DATE_FORMAT(p.TransactionDate, '%M %Y')
        ORDER BY Month DESC
      `, params);
      
      // Top spending customers
      const [topCustomers] = await connection.execute(`
        SELECT 
          u.UserID,
          CONCAT(u.FirstName, ' ', u.LastName) AS CustomerName,
          u.Email,
          COUNT(p.PaymentID) AS TransactionCount,
          SUM(p.Amount) AS TotalSpent,
          AVG(p.Amount) AS AverageSpent,
          MAX(p.TransactionDate) AS LastTransaction
        FROM PAYMENTS p 
        JOIN USERS u ON p.CustomerID = u.UserID
        WHERE p.PaymentStatus = 'Paid' ${dateFilter}
        GROUP BY u.UserID, u.FirstName, u.LastName, u.Email
        ORDER BY TotalSpent DESC
        LIMIT 10
      `, params);
      
      const revenueData = {
        overview: totalRevenue[0] || {
          TotalRevenue: 0,
          TotalTransactions: 0,
          TotalDiscounts: 0,
          NetRevenue: 0,
          AverageTransaction: 0,
          FirstTransaction: null,
          LastTransaction: null
        },
        byPaymentMethod: revenueByMethod,
        monthlyTrend: monthlyRevenue,
        topCustomers,
        dailyTrend: []
      };
      
      res.json({ success: true, data: revenueData });
    } catch (error) {
      console.error('Revenue overview error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Active rides endpoint
  app.get('/test/admin/reports/active-rides', async (req, res) => {
    try {
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
      
      res.json({ success: true, data: activeRides });
    } catch (error) {
      console.error('Active rides error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Drivers endpoint
  app.get('/test/admin/drivers', async (req, res) => {
    try {
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
      
      res.json({ success: true, data: drivers });
    } catch (error) {
      console.error('Drivers error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Complaints endpoint
  app.get('/test/admin/complaints', async (req, res) => {
    try {
      const { status } = req.query;
      let sql = `
        SELECT c.ComplaintID, c.RideID,
               CONCAT(u.FirstName,' ',u.LastName) AS FiledBy, u.Role,
               c.Description, c.ComplaintStatus, c.CreatedAt
        FROM COMPLAINTS c JOIN USERS u ON c.UserID = u.UserID WHERE 1=1`;
      const params = [];
      if (status) { sql += ' AND c.ComplaintStatus = ?'; params.push(status); }
      sql += ' ORDER BY c.CreatedAt DESC';
      
      const [complaints] = await connection.execute(sql, params);
      res.json({ success: true, data: complaints });
    } catch (error) {
      console.error('Complaints error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const PORT = 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Test API running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET /test/admin/revenue/overview');
    console.log('  GET /test/admin/reports/active-rides');
    console.log('  GET /test/admin/drivers');
    console.log('  GET /test/admin/complaints');
  });
}

createTestServer().catch(console.error);
