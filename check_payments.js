const mysql = require('./rideflow-backend/node_modules/mysql2/promise');

async function checkPayments() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      database: 'rideflow',
      user: 'root',
      password: 'DIPLOM@t98'
    });

    console.log('✅ Connected to database - Checking payments...');

    // Check payments table structure
    const [columns] = await connection.execute("SHOW COLUMNS FROM PAYMENTS");
    console.log('PAYMENTS table columns:', columns.map(col => `${col.Field} (${col.Type})`));

    // Check all payments data
    const [payments] = await connection.execute("SELECT * FROM PAYMENTS");
    console.log('\nAll payments:');
    payments.forEach(p => {
      console.log(`ID: ${p.PaymentID}, RideID: ${p.RideID}, Amount: ${p.Amount}, Status: ${p.PaymentStatus}, CustomerID: ${p.CustomerID}`);
    });

    // Check if there are any paid payments
    const [paidPayments] = await connection.execute(`
      SELECT COUNT(*) as count, SUM(Amount) as total FROM PAYMENTS 
      WHERE PaymentStatus = 'Paid'
    `);
    console.log(`\nPaid payments: ${paidPayments[0].count}, Total: ${paidPayments[0].total}`);

    // Update all payments to be paid and have proper amounts
    console.log('\nUpdating payments...');
    await connection.execute(`
      UPDATE PAYMENTS SET PaymentStatus = 'Paid', Amount = 320.00 WHERE RideID = 1
    `);
    await connection.execute(`
      UPDATE PAYMENTS SET PaymentStatus = 'Paid', Amount = 180.00 WHERE RideID = 2
    `);
    await connection.execute(`
      UPDATE PAYMENTS SET PaymentStatus = 'Paid', Amount = 250.00 WHERE RideID = 3
    `);
    await connection.execute(`
      UPDATE PAYMENTS SET PaymentStatus = 'Paid', Amount = 95.00 WHERE RideID = 4
    `);
    await connection.execute(`
      UPDATE PAYMENTS SET PaymentStatus = 'Paid', Amount = 400.00 WHERE RideID = 5
    `);
    await connection.execute(`
      UPDATE PAYMENTS SET PaymentStatus = 'Paid', Amount = 130.00 WHERE RideID = 10
    `);

    // Check again
    const [updatedPayments] = await connection.execute(`
      SELECT COUNT(*) as count, SUM(Amount) as total FROM PAYMENTS 
      WHERE PaymentStatus = 'Paid'
    `);
    console.log(`Updated paid payments: ${updatedPayments[0].count}, Total: ${updatedPayments[0].total}`);

    await connection.end();
    console.log('✅ Payment check completed!');
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

checkPayments();
