require('dotenv').config({ path: '.env.local' });
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const mysql = require('mysql2/promise');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Create a database connection pool here for the server instance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'iot_dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100
});

// === Chuẩn hóa tên thiết bị ===
const DEVICE_MAP = {
  'led_temp': 'LED_NHIET_DO',
  'led_humi': 'LED_DO_AM',
  'led_bh': 'LED_ANH_SANG',
  'lights_all_on': 'TAT_CA_LED',
  'lights_all_off': 'TAT_CA_LED',
};

function mapDeviceName(trigger) {
  if (!trigger) return 'ESP32';
  for (const [key, name] of Object.entries(DEVICE_MAP)) {
    if (trigger.includes(key)) return name;
  }
  return 'ESP32';
}

// === Khởi tạo bảng trạng thái nếu chưa có ===
async function initDeviceStatusTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS TRANG_THAI_THIET_BI (
        device_key VARCHAR(30) PRIMARY KEY,
        device_name VARCHAR(50) NOT NULL,
        is_on TINYINT(1) DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await pool.execute(`
      INSERT IGNORE INTO TRANG_THAI_THIET_BI (device_key, device_name, is_on) VALUES
      ('led_temp', 'LED_NHIET_DO', 1),
      ('led_humi', 'LED_DO_AM', 1),
      ('led_bh', 'LED_ANH_SANG', 1)
    `);
    console.log('[DB] Device status table initialized');
  } catch (e) {
    console.error('[DB] Failed to init device status table:', e.message);
  }
}

app.prepare().then(async () => {
  // Khởi tạo bảng trạng thái
  await initDeviceStatusTable();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.io to the server
  const io = new Server(server, {
    cors: { origin: '*' },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Track device status
  let lastEspSeen = 0;
  const HEARTBEAT_TIMEOUT = 10000; // 10s

  setInterval(() => {
    if (lastEspSeen > 0 && Date.now() - lastEspSeen > HEARTBEAT_TIMEOUT) {
      io.emit('device_status', { status: 'offline', trigger: 'heartbeat_timeout' });
      lastEspSeen = 0;
    }
  }, 5000);

  // Auto-cleanup: delete sensor records older than 24 hours every 10 minutes
  setInterval(async () => {
    try {
      await pool.execute(
        'DELETE FROM LICH_SU_DU_LIEU WHERE recorded_date < DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );
    } catch (e) { /* ignore cleanup errors */ }
  }, 10 * 60 * 1000);

  // Initialize MQTT Client
  const mqttClient = mqtt.connect(`mqtt://${process.env.MQTT_HOST || '172.20.10.2'}:${process.env.MQTT_PORT || 1883}`, {
    username: process.env.MQTT_USER || 'B22DCPT244',
    password: process.env.MQTT_PASSWORD || '123456',
    clientId: 'Nextjs_Dashboard_Server_' + Math.random().toString(16).substr(2, 8),
    reconnectPeriod: 2000,
    connectTimeout: 5000,
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Phát trạng thái hiện tại ngay khi kết nối
    if (mqttClient.connected) socket.emit('mqtt_status', 'connected');
    if (lastEspSeen > 0) socket.emit('device_status', { status: 'online' });

    // Xử lý khi Client yêu cầu điều khiển thiết bị
    socket.on('control_device', async (command) => {
      console.log('Sending command to MQTT:', command);
      if (mqttClient.connected) {
        const payload = typeof command === 'object' ? JSON.stringify(command) : command;
        mqttClient.publish('esp32/control', payload);

        // === Lưu trạng thái thiết bị vào DB ngay khi lệnh được gửi ===
        try {
          if (command.cmd === 'led' && command.target) {
            const deviceKey = `led_${command.target === 'bh' ? 'bh' : command.target}`;
            const isOn = command.state === 1 ? 1 : 0;
            await pool.execute(
              'UPDATE TRANG_THAI_THIET_BI SET is_on = ? WHERE device_key = ?',
              [isOn, deviceKey]
            );

            // Ghi lịch sử thao tác
            const deviceName = mapDeviceName(`led_${command.target}`);
            const status = isOn ? 'online' : 'offline';
            await pool.execute(
              'INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)',
              [deviceName, status, `led_${command.target}`]
            );
          } else if (command.cmd === 'all_lights') {
            const isOn = command.state === 1 ? 1 : 0;
            await pool.execute(
              'UPDATE TRANG_THAI_THIET_BI SET is_on = ?',
              [isOn]
            );
            const status = isOn ? 'online' : 'offline';
            await pool.execute(
              'INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)',
              ['TAT_CA_LED', status, isOn ? 'lights_all_on' : 'lights_all_off']
            );
          }
        } catch (e) {
          console.error('[DB] Error saving device state:', e.message);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  mqttClient.on('connect', () => {
    console.log('Backend connected to MQTT Broker');
    io.emit('mqtt_status', 'connected');
    mqttClient.subscribe('esp32/sensors');
    mqttClient.subscribe('esp32/status');
  });

  mqttClient.on('offline', () => {
    io.emit('mqtt_status', 'disconnected');
  });

  mqttClient.on('message', async (topic, message) => {
    const payload = message.toString();

    try {
      const data = JSON.parse(payload);

      if (topic === 'esp32/sensors') {
        const { temp, humi, hum, lux } = data;
        const finalHumi = humi !== undefined ? humi : hum; // Backward compatibility

        if (temp !== undefined && finalHumi !== undefined && lux !== undefined) {
          const [result] = await pool.execute(
            'INSERT INTO LICH_SU_DU_LIEU (temp, humi, lux) VALUES (?, ?, ?)',
            [temp, finalHumi, lux]
          );
          
          io.emit('sensor_data', { id: result.insertId, temp, humi: finalHumi, lux, recorded_date: new Date() });
        }
      } 
      else if (topic === 'esp32/status') {
        const { trigger, status } = data;
        if (status === 'online') lastEspSeen = Date.now();
        
        if (trigger) {
          const deviceName = mapDeviceName(trigger);

          // Cập nhật trạng thái thiết bị nếu là LED
          if (trigger.startsWith('led_')) {
            const deviceKey = trigger; // led_temp, led_humi, led_bh
            // Xác định trạng thái On/Off từ payload ESP32
            try {
              await pool.execute(
                'UPDATE TRANG_THAI_THIET_BI SET is_on = CASE WHEN is_on = 1 THEN 0 ELSE 1 END WHERE device_key = ?',
                [deviceKey]
              );
            } catch (e) { /* ignore */ }
          } else if (trigger.startsWith('lights_all')) {
            const isOn = trigger === 'lights_all_on' ? 1 : 0;
            try {
              await pool.execute('UPDATE TRANG_THAI_THIET_BI SET is_on = ?', [isOn]);
            } catch (e) { /* ignore */ }
          }

          await pool.execute(
            'INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)',
            [deviceName, status, trigger]
          );
          
          io.emit('device_status', data);
        }
      }
    } catch (error) {
      console.error('Error processing MQTT message:', error);
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
