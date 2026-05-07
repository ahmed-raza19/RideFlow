// config/db.js
// MySQL2 connection pool — shared across all controllers
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.MYSQL_HOST     || 'localhost',
  port:               parseInt(process.env.MYSQL_PORT) || 3306,
  database:           process.env.MYSQL_DATABASE || 'rideflow',
  user:               process.env.MYSQL_USER     || 'root',
  password:           process.env.MYSQL_PASSWORD || '',
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
