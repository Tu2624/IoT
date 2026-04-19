# IoT Master Dashboard

Hệ thống Fullstack Website giám sát và điều khiển thiết bị IoT (dựa trên vi xử lý ESP32). Dự án sử dụng stack hiện đại nhất để tối ưu tốc độ và độ mượt mà của giao diện.

## 🚀 Công nghệ sử dụng (Tech Stack)
- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 18)
- **Giao diện:** [Tailwind CSS](https://tailwindcss.com/) (Glassmorphism UI, Dark Mode)
- **Real-time Engine:** [Socket.io](https://socket.io/) (Nhận data từ Cảm biến không độ trễ)
- **IoT Message Protocol:** `mqtt.js` kết nối tới Mosquitto Broker.
- **Biểu đồ:** `recharts` theo dõi dòng thời gian.
- **Database:** MySQL (`mysql2/promise`)

## 🛠 Hướng dẫn Cài đặt & Chạy (Quick Start)

### Yêu cầu tiên quyết (Prerequisites)
1. Đã cài Node.js (version 16+).
2. XAMPP hoặc máy chủ MySQL đang bật ở port 3306.
3. MQTT Broker (Eclipse Mosquitto) đang chạy ở LAN (`172.20.10.2:2004`)

### 1. Thiết lập Cơ sở dữ liệu
Nạp file `../schema.sql` vào MySQL để tạo database `iot_dashboard` và các table cần dùng (`LICH_SU_DU_LIEU`, `BAO_CAO_BAO_MAT`).

### 2. Cấu hình biến môi trường
Kiểm tra file `.env.local` ở thư mục hiện tại:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=iot_dashboard
DB_PORT=3306

MQTT_HOST=172.20.10.2
MQTT_PORT=2004
MQTT_USER=B22DCPT244
MQTT_PASSWORD=123456
```
*(Thay đổi pass MySQL nếu máy bạn có đặt mật khẩu)*

### 3. Cài đặt thư viện & Khởi chạy Web
```bash
# 1. Cài package
npm install

# 2. Khởi chạy Server Node.js Custom (Đã tích hợp Socket.io & MQTT)
npm run dev
```

Website sẽ chạy ở địa chỉ: [http://localhost:3000](http://localhost:3000).

---

## 🏗 Kiến trúc File (Folder Structure)
- `/server.js`: Trái tim của Backend. Hook Next.js request, khởi chạy Socket.io cho Frontend subscribe, đồng thời listen MQTT Topic `esp32/sensors` và đẩy vào Database.
- `/src/app/page.tsx`: Màn hình Dashboard (Giao diện LineChart và Nút điều khiển).
- `/src/components/*`: Cấu thành bộ giao diện (Sidebar, Header, Glassmorphism Card).
- `/src/app/api/...`: Các Endpoints API JSON cấp phát dữ liệu lịch sử cho các bảng thống kê.
- `init-db.js`: Script helper tự động tạo Database qua Node.

## 🤝 Tương tác với phần cứng (ESP32 `main.cpp`)
Trong mã nguồn nhúng C++ của ESP:
- **`esp32/sensors`**: Device định kỳ `publish` JSON `{"temp":x, "hum":y, "lux":z}`. Server.js sẽ chộp lấy và văng thẳng vào Socket stream.
- **`esp32/control`**: Để thao tác bật tắt LED, Server gõ chuỗi String (VD: `led_bh_on`) đưa vào đây. ESP32 xài hàm `strstr()` để bật pin tín hiệu tương ứng.
- **`esp32/status`**: Sau khi LED bật, ESP32 `publish` xác nhận lại để Website cập nhật Database lịch sử và chuyển màu Icon báo hiệu thành công.
