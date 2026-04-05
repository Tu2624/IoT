const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function initDB() {
  try {
    // Kết nối tạm thời không cần database name để có thể CREATE DATABASE
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('Connected to MySQL server.');

    const sqlPath = path.join(__dirname, '../schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing schema.sql...');
    await connection.query(sql);

    console.log('Database and tables initialized successfully!');
    await connection.end();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDB();
