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

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.io to the server
  const io = new Server(server, {
    cors: { origin: '*' }
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
    clientId: 'Nextjs_Dashboard_Server_' + Math.random().toString(16).substr(2, 8)
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Phát trạng thái hiện tại ngay khi kết nối
    if (mqttClient.connected) socket.emit('mqtt_status', 'connected');
    if (lastEspSeen > 0) socket.emit('device_status', { status: 'online' });

    // Xử lý khi Client yêu cầu điều khiển thiết bị
    socket.on('control_device', (command) => {
      console.log('Sending command to MQTT:', command);
      if (mqttClient.connected) {
        const payload = typeof command === 'object' ? JSON.stringify(command) : command;
        mqttClient.publish('esp32/control', payload);
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
          let deviceName = 'ESP32';
          if (trigger.includes('led_temp')) deviceName = 'LED Nhiệt độ';
          else if (trigger.includes('led_humi')) deviceName = 'LED Độ ẩm';
          else if (trigger.includes('led_bh')) deviceName = 'LED Ánh sáng';
          else if (trigger.includes('lights_all')) deviceName = 'Tất cả LED';

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
