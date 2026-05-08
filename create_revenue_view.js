const db = require('./rideflow-backend/config/db');

async function createRevenueView() {
  try {
    console.log('Creating vw_RevenueByCity view...');
    
    // Drop existing view
    await db.query('DROP VIEW IF EXISTS vw_RevenueByCity');
    
    // Create new view with correct column names
    const createViewSQL = `
      CREATE VIEW vw_RevenueByCity AS
      SELECT 
        l.City,
        DATE(p.TransactionDate) AS RevenueDate,
        COUNT(p.PaymentID) AS TotalTransactions,
        COALESCE(SUM(p.Amount), 0) AS GrossRevenue,
        COALESCE(SUM(p.DiscountApplied), 0) AS TotalDiscounts,
        COALESCE(SUM(p.Amount - p.DiscountApplied), 0) AS NetRevenue
      FROM PAYMENTS p
      JOIN RIDES ri ON p.RideID = ri.RideID
      JOIN LOCATIONS l ON ri.PickupLocationID = l.LocationID
      WHERE p.PaymentStatus = 'Paid'
      GROUP BY l.City, DATE(p.TransactionDate)
      ORDER BY l.City, RevenueDate DESC
    `;
    
    await db.query(createViewSQL);
    console.log('✅ vw_RevenueByCity view created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating view:', err);
    process.exit(1);
  }
}

createRevenueView();
