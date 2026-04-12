const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'iot_dashboard'
  });

  await connection.execute(
    "INSERT IGNORE INTO TRANG_THAI_THIET_BI (device_key, device_name, is_on) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)",
    ['led_temp', 'LED_NHIET_DO', 1, 'led_humi', 'LED_DO_AM', 1, 'led_bh', 'LED_ANH_SANG', 1]
  );
  console.log('Database states perfectly synchronized.');
  await connection.end();
}

fix().catch(console.error);
