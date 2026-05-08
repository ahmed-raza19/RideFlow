const db = require('./rideflow-backend/config/db');

async function checkLocations() {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as count FROM LOCATIONS');
    console.log('Current locations count:', rows[0].count);
    
    const [locations] = await db.query('SELECT LocationID, LocationName, City FROM LOCATIONS LIMIT 5');
    console.log('Sample locations:', locations);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkLocations();
