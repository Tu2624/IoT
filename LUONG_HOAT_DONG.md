# 🌊 Tài Liệu Kiến Trúc & Luồng Hoạt Động Của Dự Án IoT (Tham Chiếu Code Chi Tiết)

Tài liệu này giải thích chi tiết luồng chạy của toàn bộ hệ thống IoT. Các tính năng cốt lõi được gắn chú thích **(Đường dẫn file : Dòng Code Mẫu)** để bạn dễ dàng tra cứu, đọc hiểu và bảo vệ trước Hội đồng.

---

## 1. Phần Cứng - ESP32 (Hardware & Firmware)
**Thư mục chính:** `src/main.cpp`

- **Nhiệm vụ thu thập dữ liệu (Hàm `updateSensors` | Dòng `199 - 225`):**
  - Đọc DHT11 và BH1750 sau mỗi 2 giây.
  - *Đoạn code nổi bật (`main.cpp` Dòng 219 - 224):* Đóng gói thành chuỗi JSON và gửi lên Topic MQTT `esp32/sensors`.
    ```cpp
    char buffer[80];
    snprintf(buffer, sizeof(buffer), "{\"temp\":%.1f,\"humi\":%.1f,\"lux\":%.1f}", t, h, lux);
    client.publish(TOPIC_SENSORS, buffer);
    ```

- **Nhiệm vụ Điều khiển thiết bị (Hàm `mqttCallback` | Dòng `83 - 162`):**
  - Bắt toàn bộ tin nhắn từ Web chỉ định xuống Topic `esp32/control`. Tách JSON và sử dụng ngắt rẽ nhánh để điều khiển `ledMode` hoặc đẩy chân tín hiệu I/O HIGH/LOW.
  - *Đoạn code nổi bật (`main.cpp` Dòng 118 - 134):* Hàm bắt lệnh điều khiển LED đơn lẻ.

- **Nhiệm vụ Báo cáo Trạng thái về Web (Hàm `publishStatus` | Dòng `64 - 81`):**
  - Sau khi chuyển đổi trạng thái của LED/Relay xong, nó bắn lên Topic `esp32/status` để đánh tiếng cho Web biết lệnh đã thực thi thành công.

- **Cơ chế Non-blocking (Chống treo CPU | Dòng `202`):**
  - Thay vì `delay(2000)`, khối Code dùng `unsigned long currentMillis = millis();` so sánh khoảng cách thời gian. Kỹ thuật này giúp vòng `loop()` quay với tốc độ cực nhanh để kịp bắt bất cứ lệnh MQTT nào từ người dùng, chứ không bị "đóng băng" đứng chờ cảm biến.

## 2. Phần Giao Tiếp Dữ liệu & Xử Lý Giữa (Middleware Engine Node.js)
**Thư mục chính:** `web-dashboard/server.js`

Đây là "trái tim" gắn kết phần cứng và Database. Khi khởi động bộ Code này sẽ được kích hoạt chạy ngầm (`npm run dev`).

- **Thường trực nghe Data Cảm biến (Dòng `168 - 181`):**
  - Khi topic `esp32/sensors` nổ Data ➝ Đọc thông số và lấy luôn giờ hệ thống.
  - *Ghi Database (`server.js` Dòng 174):* 
    ```javascript
    await pool.execute('INSERT INTO LICH_SU_DU_LIEU (temp, humi, lux) VALUES (?, ?, ?)', ...);
    ```
  - *Bắn ngay lên Web (`server.js` Dòng 179):*
    ```javascript
    io.emit('sensor_data', { id: result.insertId, temp, humi... });
    // => Web bắt được lệnh io.emit này là vẽ thẳng lên Line Chart.
    ```

- **Chuyển tải Lệnh Web xuống Phần Cứng (Dòng `116 - 144`):**
  - Web đẩy một tín hiệu điều khiển qua Socket.io: `socket.on('control_device')`.
  - Server.js cầm chuỗi này và gọi `mqttClient.publish('esp32/control', payload)` (Đưa xuống mạch). Đồng thời nó lấy bút ghi vào Bảng lịch sử MySQL một trạng thái `waiting` tạm thời đợi ESP32 phản hồi.

- **Lưu nhật ký tự động Đồng bộ (Dòng `182 - 284`):**
  - Khi ESP32 chạy xong và gửi trả Topic `esp32/status`. Dòng trạng thái `waiting` lúc nãy ở trong Database sẽ được hàm `UPDATE LICH_SU_HANH_DONG SET status = ...` (Dòng 248) sửa biến thành lệnh Success/Thành công thành chu trình khép kín.

## 3. Phần Web Dashboard (Next.js 15 Frontend & Backend)
**Thư mục làm việc cốt lõi:** `web-dashboard/src/app`

### 3.1 Khối Giao diện Người dùng (Frontend UI Routes)
- **Tương tác Người dùng (Nơi bấm Button):** 
  - Tại file `src/app/page.tsx` (Dòng `85-87`), các component `<DeviceToggle />` được render. 
  - Khi bạn Click vào nút Switch, sự kiện `onChange` sẽ gọi hàm `toggleLed('temp/humi/bh')` (Dòng `135` file `src/context/DeviceContext.tsx`).
  - Hàm này sẽ ngay lập tức:
    1. **Cập nhật giao diện (Optimistic UI):** Đổi màu nút bấm ngay để người dùng thấy mượt mà.
    2. **Phát lệnh qua Socket:** Gọi `socket.current.emit('control_device', ...)` để đẩy lệnh sang Server.
    3. **Kích hoạt bộ đếm ngược (Timeout 5s):** Nếu sau 5s ESP32 không phản hồi, nó sẽ hoàn tác (revert) lại màu nút bấm và báo lỗi.

- **Trang Dashboard (`src/app/page.tsx`):**
  - *UI Biểu đồ:* Bắt Socket ở file `DeviceContext.tsx` (Dòng `89 - 104`) và đẩy vào state `sensorHistory`. Biểu đồ tại `page.tsx` chỉ việc render từ state này bằng thư viện Recharts.

- **Nơi Nhận Dữ Liệu (Data Reception):**
  - Dữ liệu cảm biến không nhận trực tiếp ở `page.tsx` mà được quản lý tập trung tại `src/context/DeviceContext.tsx` (Dòng `89`).
  - Khi Server Node.js bắn lệnh `io.emit('sensor_data')`, hàm `socket.current.on('sensor_data', ...)` sẽ bắt lấy, cập nhật vào state `currentSensor` để hiển thị các con số nhiệt độ/độ ẩm to trên màn hình.

- **Trang Tra Cứu Data (`src/app/data-sensor/page.tsx`):**
  - Có các ô Field tìm kiếm đa diện. Khi người dùng Gõ Search và Enter, Web sẽ gọi lên API Backend báo cáo kết quả.

### 3.2 Nhánh xử lý Tín Hiệu (Backend API Routes)
Nằm tại thư mục `src/app/api/...`
- **Bộ máy Tìm kiếm SQL (`api/sensors/list/route.ts` & `api/actions/list/route.ts`):** 
  - Khối code nhận yêu cầu Search của ngời dùng ➝ Chuyển thể tham số đó thành String.
  - *Code SQL nổi bật:* `SELECT * FROM LICH_SU_DU_LIEU WHERE [Nhập điều kiện Search SQL OR AND] ORDER BY thoi_gian DESC LIMIT ? OFFSET ?`. Giúp việc lọc dữ liệu và phân trang trên giao diện không bao giờ load rác thừa.

- **API Xử Lý Lỗi Cơ chế Timeout 5s (`api/actions/report-failure/route.ts`):** 
  - File quan trọng bảo toàn trạng thái Code. Ở `DeviceContext.tsx`, nếu đếm 5 giây trôi qua mà Socket chưa trả về tín hiệu thành công. Giao diện Frontend sẽ ngầm `fetch('/api/actions/report-failure', { method: 'POST', body: ...})`.
  - API Này ghi đè vào DB MySQL trạng thái "Thất bại/Lỗi Mạng" giúp báo cáo bảo mật ghi vết lại sự cố phần cứng. Giao diện công tắc cũng vì thế mà bật rớt trở về giá trị ban đầu!

## 4. Cơ Sở Dữ Liệu (MySQL Database)
**Mã khởi tạo Tables:** `schema.sql` (Ở ngay thư mục gốc cùa Visual Studio)

Dữ liệu lưu lại qua 2 bảng chính đóng vai trò cốt yếu:
- **`LICH_SU_DU_LIEU` (Data Sensor):** Chứa Data nhiệt. Các tên trường `thoi_gian`, `nhiet_do`, `do_am`, `anh_sang` (Khởi tạo ở Dòng 61 - 69 file schema).
- **`LICH_SU_HANH_DONG` (Action History):** Giúp lưu giữ vết điều khiển. Các tên trường `thoi_gian`, `thiet_bi`, `hanh_dong`, `trang_thai` (Khởi tạo ở Dòng 74 - 82 file schema).

---

## 🔄 Tóm Lược Nhánh Hoạt Động Đồng Bộ Cốt Lõi:
Khi Thầy Cô yêu cầu: *"Em hãy mô tả luồng điều khiển của 1 cái đèn bật tắt xem nó chạy qua những phần nào, file nào?"*

> **[Luồng Xuống - Điều khiển] Trả lời:** Khi bấm nút trên Giao diện (`app/page.tsx` gọi hàm `toggleLed` tại `context/DeviceContext.tsx`), Giao diện lập tức văng trạng thái sang '*Đang chờ*'. Đồng thời nó bắn một sự kiện Socket.io sang cho cục Node.js (`server.js` Dòng 117).
> Cục này hoạt động dạng Cầu Nối, cầm lệnh này đóng gói thành MQTT và đưa cho Broker bắn xuống ESP32 (`main.cpp` Dòng 83).

> **[Luồng Lên - Thu thập Data] Trả lời:** ESP32 đọc cảm biến 2s/lần gửi lên MQTT `esp32/sensors`. Cục Node.js (`server.js` Dòng 168) nghe thấy, vừa ghi vào MySQL vừa dùng `io.emit` bắn lên Web. Web tại `DeviceContext.tsx` nghe lệnh này và cập nhật lên màn hình Dashboard ngay lập tức. Tính năng khép kín hoàn chỉnh!
