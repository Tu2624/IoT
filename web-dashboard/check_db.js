const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'iot_dashboard'
  });

  const [rows] = await connection.execute(
    'SELECT * FROM LICH_SU_HANH_DONG ORDER BY report_id DESC LIMIT 5'
  );
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}

checkDb().catch(console.error);
