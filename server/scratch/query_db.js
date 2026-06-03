// C:\Users\Saiko\.gemini\antigravity-ide\brain\b555a3cc-b3ee-4cbe-b7af-89195e62ba29/scratch/query_db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'yourpassword';
  const port = process.env.DB_PORT || 3306;
  const database = process.env.DB_NAME || 'grabngo';

  try {
    const connection = await mysql.createConnection({ host, user, password, database, port });
    console.log('Connected to MySQL!');

    const [orders] = await connection.query('SELECT id, order_number, delivery_mode FROM orders ORDER BY id DESC LIMIT 5');
    console.log('ORDERS:', orders);

    const [items] = await connection.query('SELECT * FROM order_items LIMIT 10');
    console.log('ORDER ITEMS:', items);

    await connection.end();
  } catch (err) {
    console.error('MySQL query error:', err.message);
  }
}

test();
