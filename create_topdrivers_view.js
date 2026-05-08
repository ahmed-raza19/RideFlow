const db = require('./rideflow-backend/config/db');

async function createTopDriversView() {
  try {
    console.log('Creating vw_TopDrivers view...');
    
    // Drop existing view
    await db.query('DROP VIEW IF EXISTS vw_TopDrivers');
    
    // Create the missing view
    const createViewSQL = `
      CREATE VIEW vw_TopDrivers AS
      SELECT 
        d.DriverID,
        CONCAT(u.FirstName, ' ', u.LastName) AS DriverName,
        d.VerificationStatus,
        d.CommissionRate,
        COALESCE(l.City, 'Unknown') AS City,
        ROUND(AVG(r.Score), 2) AS AvgRating,
        COUNT(r.Score) AS TotalRatings,
        COUNT(DISTINCT ri.RideID) AS TotalRides
      FROM DRIVERS d
      JOIN USERS u ON d.UserID = u.UserID
      JOIN RATINGS r ON r.RatedUserID = u.UserID
      LEFT JOIN RIDES ri ON ri.DriverID = d.DriverID AND ri.RideStatus = 'Completed'
      LEFT JOIN LOCATIONS l ON d.CurrentLocationID = l.LocationID
      GROUP BY d.DriverID, u.FirstName, u.LastName, d.VerificationStatus, d.CommissionRate, COALESCE(l.City, 'Unknown')
      HAVING AVG(r.Score) > 4.5
      ORDER BY AvgRating DESC
    `;
    
    await db.query(createViewSQL);
    console.log('✅ vw_TopDrivers view created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error creating view:', err);
    process.exit(1);
  }
}

createTopDriversView();
