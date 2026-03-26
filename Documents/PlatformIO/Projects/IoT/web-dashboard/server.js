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
  queueLimit: 0
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

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Xử lý khi Client yêu cầu điều khiển thiết bị
    socket.on('control_device', (command) => {
      console.log('Sending command to MQTT:', command);
      if (mqttClient.connected) {
        mqttClient.publish('esp32/control', command);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Initialize MQTT Client
  const mqttClient = mqtt.connect(`mqtt://${process.env.MQTT_HOST || '172.20.10.2'}:${process.env.MQTT_PORT || 1883}`, {
    username: process.env.MQTT_USER || 'B22DCPT244',
    password: process.env.MQTT_PASSWORD || '123456',
    clientId: 'Nextjs_Dashboard_Server_' + Math.random().toString(16).substr(2, 8)
  });

  mqttClient.on('connect', () => {
    console.log('Backend connected to MQTT Broker');
    mqttClient.subscribe('esp32/sensors');
    mqttClient.subscribe('esp32/status');
  });

  mqttClient.on('message', async (topic, message) => {
    const payload = message.toString();
    console.log(`[MQTT] Topic: ${topic}, Message: ${payload}`);

    try {
      const data = JSON.parse(payload);

      if (topic === 'esp32/sensors') {
        // Lưu vào DB bảng LICH_SU_DU_LIEU
        const { temp, hum, lux } = data;
        if (temp !== undefined && hum !== undefined && lux !== undefined) {
          const [result] = await pool.execute(
            'INSERT INTO LICH_SU_DU_LIEU (temp, humi, lux) VALUES (?, ?, ?)',
            [temp, hum, lux]
          );
          
          // Phát qua Socket.io kèm time hiện tại
          io.emit('sensor_data', { id: result.insertId, temp, hum, lux, recorded_date: new Date() });
        }
      } 
      else if (topic === 'esp32/status') {
        // Lưu vào bảng BAO_CAO_BAO_MAT
        const { trigger, status } = data; // VD: trigger "cmd_led_bh_on", status "online"
        if (trigger) {
          await pool.execute(
            'INSERT INTO BAO_CAO_BAO_MAT (device_name, status, description) VALUES (?, ?, ?)',
            ['ESP32', status, trigger]
          );
          
          // Phát qua io trạng thái
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
