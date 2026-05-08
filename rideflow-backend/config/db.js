// config/db.js
// MySQL2 connection pool — shared across all controllers
const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });


const pool = mysql.createPool({
  host:               'localhost',
  port:               3306,
  database:           'RideFlow',
  user:               'root',
  password:           'DIPLOM@t98',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅  MySQL connected — rideflow database ready');
    conn.release();
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);
  }
})();

module.exports = pool;
