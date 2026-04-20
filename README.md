# 🌐 Hệ thống Giám sát & Điều khiển Thiết bị IoT (ESP32 + Next.js)

Dự án này là một giải pháp Fullstack hoàn chỉnh (IoT Hardware + Web Dashboard) cho phép giám sát dữ liệu cảm biến theo thời gian thực và đóng ngắt thiết bị từ xa qua giao thức MQTT.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![ESP32](https://img.shields.io/badge/ESP32-E7352C?style=for-the-badge&logo=espressif&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![MQTT](https://img.shields.io/badge/MQTT-660066?style=for-the-badge&logo=mqtt&logoColor=white)

---

## 🏗 Cấu trúc Dự án (Project Structure)
Dự án được chia làm 2 thành phần chính đặt trong cùng một Repository:

1. **`./` (Root Directory): Mã nguồn Phần cứng (Firmware)**
   - Nền tảng: **PlatformIO** (C/C++)
   - Vi điều khiển: **ESP32**
   - Nhiệm vụ: Đọc cảm biến nhiệt độ, độ ẩm (DHT11), ánh sáng (BH1750), điều khiển các chân LED/Relay. Giao tiếp với Broker qua MQTT.
   - File lõi: `src/main.cpp` (hoặc `main.cpp` ở thư mục gốc).

2. **`./web-dashboard/`: Mã nguồn Web Giao diện (Software)**
   - Nền tảng: **Next.js (React)** kết hợp **Custom Node.js Server**
   - Nhiệm vụ: Cung cấp giao diện UI dạng Glassmorphism Dark Mode. Lắng nghe MQTT, lưu trữ dữ liệu vào MySQL, và đẩy Socket.io lên biểu đồ (Line Chart) theo thời gian thực.
   - Các trang chính:
     - Dashboard (Real-time chart & Toggles điều khiển).
     - Data Sensor (Bảng lịch sử cảm biến hỗ trợ xuất Excel).
     - Action History (Nhật ký thao tác MQTT).
     - Profile (Thông tin Sinh viên).

---

## 🛠 Hướng dẫn Cài đặt (Getting Started)

### 1. Nạp Code cho ESP32 (Hardware)
1. Mở thư mục gốc của dự án bằng **VS Code** có cài sẵn **PlatformIO** extension.
2. Mở file `main.cpp`. Cấu hình lại thông tin WiFi và MQTT Broker:
   ```cpp
   const char* ssid        = "TÊN_WIFI";
   const char* password    = "PASS_WIFI";
   const char* mqtt_server = "172.20.10.2"; // Đổi thành IP của Broker
   // ... Sửa các config username/password mqttClient trong mục reconnect()
   ```
3. Cắm mạch ESP32 vào máy tính và bấm **Build & Upload** (dấu mũi tên `->` dưới thanh status bar của PlatformIO).

### 2. Thiết lập Database (MySQL)
1. Cài đặt và bật máy chủ MySQL (VD: XAMPP). Chắc chắn port `3306` đang hoạt động.
2. Dùng file `schema.sql` có sẵn ở thư mục gốc import vào CSDL để tạo các bảng `LICH_SU_DU_LIEU`, `LICH_SU_HANH_DONG` và `NGUOI_DUNG`.

### 3. Cài đặt & Chạy Website Dashboard
1. Trỏ terminal vào thư mục web:
   ```bash
   cd web-dashboard
   ```
2. Cấp quyền các config biến môi trường bằng cách tạo/chỉnh sửa file `.env.local` (nếu cần đổi pass Database):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=iot_dashboard
   DB_PORT=3306

   MQTT_HOST=172.20.10.2
   MQTT_PORT=2004
   MQTT_USER=YOUR_USER
   MQTT_PASSWORD=YOUR_PASS
   ```
3. Cài đặt thư viện NPM Node.js:
   ```bash
   npm install
   ```
   ```bash
   npm run dev
   ```
5. Truy cập Website tại: [http://localhost:3000](http://localhost:3000)

---

## 💡 Tính năng Nổi bật (Features)
- Bật tắt tách biệt hoàn toàn giữa việc **Đọc cảm biến** (Tắt mở Sensor trên Card) và **Chiếu sáng đèn/Thiết bị** (Bật tắt Relay).
- UI/UX Bóng bẩy, có Animation trạng thái kết hợp đồ thị Recharts cực mượt.
- Hệ thống Logging đầy đủ và dễ dàng trace lỗi qua giao diện bảng.
- Khả năng xuất (Export) dữ liệu CSV thống kê phục vụ báo cáo.

---

*Phát triển bởi Vũ Đình Tú - Sinh viên DACT (Mã SV: B22DCPT244)*
