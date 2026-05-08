const db = require('./rideflow-backend/config/db');

async function testLocationsAPI() {
  try {
    // Test the same query as the rider controller
    const [rows] = await db.query('SELECT * FROM LOCATIONS ORDER BY City, LocationName');
    
    console.log(`Found ${rows.length} locations in database`);
    console.log('\nLocations by city:');
    
    const cities = {};
    rows.forEach(location => {
      if (!cities[location.City]) {
        cities[location.City] = [];
      }
      cities[location.City].push(location);
    });
    
    Object.keys(cities).forEach(city => {
      console.log(`\n${city} (${cities[city].length} locations):`);
      cities[city].forEach(loc => {
        console.log(`  - ${loc.LocationName} (${loc.Street})`);
      });
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testLocationsAPI();
