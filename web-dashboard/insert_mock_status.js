require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 100
  });

  console.log("Inserting demo offline/waiting statuses...");

  const queries = [
    pool.query("INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)", ['LED Nhiệt độ', 'offline', 'led_temp_toggle']),
    pool.query("INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)", ['LED Độ ẩm', 'waiting', 'led_humi_toggle']),
    pool.query("INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)", ['LED Ánh sáng', 'offline', 'led_bh_toggle']),
    pool.query("INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)", ['Tất cả LED', 'waiting', 'lights_all'])
  ];

  await Promise.all(queries);

  console.log("Done");
  process.exit(0);
}

main().catch(console.error);
