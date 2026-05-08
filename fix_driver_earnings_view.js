const db = require('./rideflow-backend/config/db');

async function fixDriverEarningsView() {
  try {
    console.log('Fixing vw_DriverEarnings view...');
    
    // Drop existing view
    await db.query('DROP VIEW IF EXISTS vw_DriverEarnings');
    
    // Create corrected view with proper column names
    const createViewSQL = `
      CREATE VIEW vw_DriverEarnings AS
      SELECT 
        d.DriverID,
        CONCAT(u.FirstName, ' ', u.LastName) AS DriverName,
        d.CommissionRate,
        COUNT(ri.RideID) AS CompletedRides,
        COALESCE(SUM(p.Amount), 0) AS GrossEarnings,
        ROUND(COALESCE(SUM(p.Amount), 0) * d.CommissionRate / 100, 2) AS PlatformCommission,
        ROUND(COALESCE(SUM(p.Amount), 0) * (1 - d.CommissionRate/100), 2) AS NetEarnings,
        d.WalletBalance AS CurrentWallet
      FROM DRIVERS d
      JOIN USERS u ON d.UserID = u.UserID
      LEFT JOIN RIDES ri ON ri.DriverID = d.DriverID AND ri.RideStatus = 'Completed'
      LEFT JOIN PAYMENTS p ON p.RideID = ri.RideID AND p.PaymentStatus = 'Paid'
      GROUP BY d.DriverID, u.FirstName, u.LastName, d.CommissionRate, d.WalletBalance
    `;
    
    await db.query(createViewSQL);
    console.log('✅ vw_DriverEarnings view fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing view:', err);
    process.exit(1);
  }
}

fixDriverEarningsView();
