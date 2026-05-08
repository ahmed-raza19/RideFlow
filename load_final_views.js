const fs = require('fs');
const db = require('./rideflow-backend/config/db');

async function loadFinalViews() {
  try {
    console.log('Loading final views...');
    
    const viewsSQL = fs.readFileSync('./06_views.sql', 'utf8');
    await db.query(viewsSQL);
    console.log('✓ Final views loaded successfully');
    
    console.log('\n✅ Views updated and loaded!');
    process.exit(0);
  } catch (err) {
    console.error('Error loading views:', err);
    process.exit(1);
  }
}

loadFinalViews();
