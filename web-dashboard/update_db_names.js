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

  console.log("Updating Old ESP32 names...");

  await pool.query("UPDATE LICH_SU_HANH_DONG SET device_name = 'LED Nhiệt độ' WHERE description LIKE '%led_temp%'");
  await pool.query("UPDATE LICH_SU_HANH_DONG SET device_name = 'LED Độ ẩm' WHERE description LIKE '%led_humi%'");
  await pool.query("UPDATE LICH_SU_HANH_DONG SET device_name = 'LED Ánh sáng' WHERE description LIKE '%led_bh%'");
  await pool.query("UPDATE LICH_SU_HANH_DONG SET device_name = 'Tất cả LED' WHERE description LIKE '%lights_all%'");

  // They said: "bo cai ten ESP32 di chi co 3 led kia thoi"
  // So we can delete the remaining ESP32 rows which don't map to these LEDs
  await pool.query("DELETE FROM LICH_SU_HANH_DONG WHERE device_name = 'ESP32'");

  console.log("Done");
  process.exit(0);
}

main().catch(console.error);
