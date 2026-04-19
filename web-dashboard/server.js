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
    console.log('[DB] Device status table initialized (Persistence enabled)');
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
        'DELETE FROM LICH_SU_DU_LIEU WHERE recorded_date < DATE_SUB(NOW(), INTERVAL 72 HOUR)'
      );
    } catch (e) { /* ignore cleanup errors */ }
  }, 10 * 60 * 1000);

  // Initialize MQTT Client
  const mqttClient = mqtt.connect(`mqtt://${process.env.MQTT_HOST || '172.20.10.2'}:${process.env.MQTT_PORT || 2004}`, {
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

        // === Ghi dòng 'waiting' kèm ý định (online/offline) để đối chiếu chính xác ===
        try {
          if (command.cmd === 'led' && command.target) {
            const deviceName = mapDeviceName(`led_${command.target}`);
            const intent = command.state === 1 ? 'online' : 'offline';
            await pool.execute(
              'INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)',
              [deviceName, 'waiting', `Request: led_${command.target}:${intent}`]
            );
          } else if (command.cmd === 'all_lights') {
            const isOn = command.state === 1 ? 1 : 0;
            const intent = isOn ? 'online' : 'offline';
            await pool.execute(
              'INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)',
              ['TAT_CA_LED', 'waiting', `Request: all_lights:${intent}`]
            );
          }
        } catch (e) {
          console.error('[DB] Error saving waiting log:', e.message);
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
        lastEspSeen = Date.now(); // Cập nhật heartbeat vì ESP32 vẫn đang bơm dữ liệu Sensor!
        const { temp, humi, hum, lux } = data;
        const finalHumi = humi !== undefined ? humi : hum;

        if (temp !== undefined && finalHumi !== undefined && lux !== undefined) {
          const [result] = await pool.execute(
            'INSERT INTO LICH_SU_DU_LIEU (temp, humi, lux) VALUES (?, ?, ?)',
            [temp, finalHumi, lux]
          );

          io.emit('sensor_data', { id: result.insertId, temp, humi: finalHumi, lux, recorded_date: new Date() });
        }
      }
      else if (topic === 'esp32/status') {
        let { trigger, status } = data;
        if (status === 'online') lastEspSeen = Date.now();

        // 1. Chuẩn hóa trạng thái siêu nhạy: 'online' hoặc 'offline'
        // Chấp nhận mọi biến thể: 1/0, on/off, ON/OFF, true/false
        const s = String(status || '').toLowerCase();
        const normalizedStatus = (s === 'online' || s === 'on' || s === '1' || s === 'true')
          ? 'online'
          : 'offline';

        console.log(`[MQTT Status] Trigger: ${trigger} | Raw: ${status} | Final: ${normalizedStatus}`);

        if (trigger === 'connect' || trigger === 'lwt') {
          // ĐỒNG BỘ: Nếu thiết bị vừa bật lên, lấy dữ liệu DB và bắt thiết bị đổi theo DB
          if (trigger === 'connect') {
            try {
              const [devices] = await pool.execute('SELECT device_key, is_on FROM TRANG_THAI_THIET_BI');

              let syncPayload = { cmd: 'sync', temp: 0, humi: 0, bh: 0 };

              devices.forEach((device) => {
                if (device.device_key === 'led_temp') syncPayload.temp = device.is_on;
                if (device.device_key === 'led_humi') syncPayload.humi = device.is_on;
                if (device.device_key === 'led_bh') syncPayload.bh = device.is_on;
              });

              // Bắn thẳng xuống ngay lập tức không cần đợi vì Mosquitto đảm bảo tính tuần tự
              mqttClient.publish('esp32/control', JSON.stringify(syncPayload));
              console.log(`[SYNC] Bulk sync sent to ESP32 INMEDIATELY:`, syncPayload);
            } catch (e) { console.error('[SYNC ERR]', e.message); }
          }
        }
        else if (trigger) {
          const deviceName = mapDeviceName(trigger);
          const deviceKey = trigger.startsWith('led_') ? trigger : null;

          try {
            // 2. Lấy trạng thái hiện tại từ DB để so sánh
            let currentStatus = '';
            if (deviceKey) {
              const [rows] = await pool.execute('SELECT status FROM TRANG_THAI_THIET_BI WHERE device_key = ?', [deviceKey]);
              if (rows.length > 0) currentStatus = rows[0].is_on ? 'online' : 'offline';
            }

            // 3. XÁC ĐỊNH TRẠNG THÁI CUỐI CÙNG (Ưu tiên trường 'state' mới từ ESP32)
            let finalStatus = normalizedStatus;

            // Thử tìm dòng 'waiting' gần nhất
            const [waitingRows] = await pool.execute(
              'SELECT description FROM BAO_CAO_BAO_MAT WHERE device_name = ? AND status = ? ORDER BY report_id DESC LIMIT 1',
              [deviceName, 'waiting']
            );

            if (waitingRows.length > 0) {
              const description = waitingRows[0].description;
              // Nếu ESP32 có gửi trường 'state' (firmware mới), dùng nó luôn
              if (data.state !== undefined) {
                finalStatus = data.state === 1 ? 'online' : 'offline';
              }
              // Nếu không (firmware cũ), bóc tách ý định từ description (led_temp:offline -> offline)
              else if (description.includes(':')) {
                finalStatus = description.split(':').pop();
              }

              // Cập nhật dòng 'waiting' thành trạng thái cuối cùng
              await pool.execute(
                'UPDATE BAO_CAO_BAO_MAT SET status = ?, description = ?, report_date = NOW() WHERE device_name = ? AND status = ? ORDER BY report_id DESC LIMIT 1',
                [finalStatus, `Success: ${trigger}`, deviceName, 'waiting']
              );
            } else {
              // 4. Nếu không có 'waiting' (bấm nút vật lý), ghi log mới. (Đã bỏ logic isStatusChanged gây lỗi)
              await pool.execute(
                'INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)',
                [deviceName, normalizedStatus, trigger]
              );
            }

            // 5. Luôn cập nhật DB trạng thái thực tế khi có kết quả mới
            const updatedOn = finalStatus === 'online' ? 1 : 0;

            // Xử lý lưu trạng thái: Nếu là lệnh điều khiển tất cả -> Cập nhật cả 3 đèn
            if (trigger.includes('lights_all')) {
              await pool.execute('UPDATE TRANG_THAI_THIET_BI SET is_on = ?', [updatedOn]);
            }
            // Đèn đơn lẻ
            else if (deviceKey) {
              await pool.execute('UPDATE TRANG_THAI_THIET_BI SET is_on = ? WHERE device_key = ?', [updatedOn, deviceKey]);
            }

            // === ĐỒNG BỘ HÓA TOÀN DIỆN (Dành cho cả Heartbeat và hành động) ===
            // Nếu bản tin có chứa trạng thái cụ thể của từng đèn, cập nhật luôn để khớp 100% phần cứng
            if (data.led_temp !== undefined) await pool.execute('UPDATE TRANG_THAI_THIET_BI SET is_on = ? WHERE device_key = ?', [data.led_temp, 'led_temp']);
            if (data.led_humi !== undefined) await pool.execute('UPDATE TRANG_THAI_THIET_BI SET is_on = ? WHERE device_key = ?', [data.led_humi, 'led_humi']);
            if (data.led_bh !== undefined) await pool.execute('UPDATE TRANG_THAI_THIET_BI SET is_on = ? WHERE device_key = ?', [data.led_bh, 'led_bh']);

          } catch (e) {
            console.error('[DB] Error processing device status log:', e.message);
          }

          io.emit('device_status', { ...data, status: normalizedStatus });
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
