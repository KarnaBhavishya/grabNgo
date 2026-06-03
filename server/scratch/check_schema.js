// C:\Users\Saiko\OneDrive\Desktop\GrabNGo\server\scratch\check_schema.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSchema() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'yourpassword';
  const port = process.env.DB_PORT || 3306;
  const database = process.env.DB_NAME || 'grabngo';

  try {
    const connection = await mysql.createConnection({ host, user, password, database, port });
    console.log(`Connected to MySQL database: ${database}`);

    // Get list of all tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('\n--- CURRENT TABLES ---');
    console.log(tableNames.join(', '));

    // Get addresses columns
    if (tableNames.includes('addresses')) {
      const [cols] = await connection.query('DESCRIBE addresses');
      console.log('\n--- COLUMNS IN addresses ---');
      cols.forEach(c => console.log(`${c.Field}: ${c.Type} (${c.Null === 'YES' ? 'NULLABLE' : 'NOT NULL'})`));
    } else {
      console.log('\n❌ addresses table is missing.');
    }

    // Get orders columns
    if (tableNames.includes('orders')) {
      const [cols] = await connection.query('DESCRIBE orders');
      console.log('\n--- COLUMNS IN orders ---');
      cols.forEach(c => console.log(`${c.Field}: ${c.Type} (${c.Null === 'YES' ? 'NULLABLE' : 'NOT NULL'})`));
    } else {
      console.log('\n❌ orders table is missing.');
    }

    // Verify all tables from db.js exist
    const expectedTables = ['users', 'addresses', 'categories', 'shops', 'products', 'orders', 'order_items', 'order_timeline', 'payments', 'reviews', 'notifications', 'delivered_orders'];
    console.log('\n--- TABLE CHECKLIST ---');
    expectedTables.forEach(tbl => {
      const exists = tableNames.includes(tbl);
      console.log(`${exists ? '✅' : '❌'} ${tbl} table`);
    });

    await connection.end();
  } catch (err) {
    console.error('Database connection / query error:', err.message);
  }
}

checkSchema();
