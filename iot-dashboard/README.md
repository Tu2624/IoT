# IoT Dashboard Prototype

Đây là phiên bản Frontend UI (Vue 3 + Vite) được thiết kế theo bản vẽ Figma, hiện tại đang sử dụng **dữ liệu giả lập (mock data)** để demo giao diện.

## 🚀 Cách chạy giao diện (Prototype)

Yêu cầu đã cài đặt **Node.js** (khuyên dùng bản v18 trở lên).

1. Mở Terminal (Command Prompt / PowerShell) tại thư mục `iot-dashboard`.
2. Cài đặt các thư viện (chỉ cần chạy lần đầu tiên):
   ```bash
   npm install
   ```
3. Khởi động server Frontend:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt và truy cập vào đường link hiển thị trong Terminal (thường là `http://localhost:5173`).

---

## 🔗 Kế hoạch kết nối Backend thật (Node.js + MQTT + MySQL)

Để giao diện này chạy với dữ liệu thật từ thiết bị ESP32 của bạn, cần xây dựng thêm phần Backend. Dưới đây là cấu hình cần thiết khi bạn làm tiếp Backend.

### 1. Cấu hình Phần Cứng (ESP32 qua MQTT)
Theo file `README.md` cũ của ESP32, thiết bị của bạn đang kết nối tới MQTT Broker tại:
- **Broker IP:** `172.20.10.2`
- **Port:** `2004`
- **User/Pass:** `B22DCPT244` / `123456`

**Các topic MQTT:**
- Đọc dữ liệu: `esp32/sensors` (Temp, Hum, Lux)
- Gửi lệnh điều khiển: `esp32/control` (Lệnh: `on`, `off`, `wave_on`...)

**➡️ Cách Backend xử lý:**
Backend Node.js sẽ dùng thư viện `mqtt` để kết nối tới Broker trên. Nó sẽ *subscribe* topic `esp32/sensors` để lấy dữ liệu cảm biến và lưu vào Database, đồng thời bắn socket xuống Frontend. Khi trên Frontend bạn bấm nút bật/tắt, Backend sẽ nhận API và *publish* lệnh vào `esp32/control`.

### 2. Cấu hình Cơ sở dữ liệu (MySQL)
Cần tạo một database MySQL với 2 bảng sau (tham khảo):

**Bảng 1: `sensor_readings` (Dữ liệu cảm biến)**
- `id` (INT, Primary Key, Auto Increment)
- `temperature` (FLOAT)
- `humidity` (FLOAT)
- `lux` (FLOAT)
- `timestamp` (DATETIME)

**Bảng 2: `action_history` (Lịch sử lệnh)**
- `id` (INT, Primary Key, Auto Increment)
- `cmd` (VARCHAR) - Lệnh đã gửi (vd: on, off)
- `device` (VARCHAR)
- `success` (BOOLEAN)
- `timestamp` (DATETIME)

**➡️ Cách Backend xử lý:**
Sử dụng thư viện `mysql2` trong Node.js để kết nối. Mỗi khi nhận MQTT message có dữ liệu mới, lưu vào `sensor_readings`. Mỗi khi gửi lệnh điều khiển, lưu vào `action_history`. Frontend sẽ gọi API GET (ví dụ: `http://localhost:3000/api/data-sensor`) để lấy dữ liệu hiển thị lên bảng.
