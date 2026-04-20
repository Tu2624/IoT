# 🎓 KỊCH BẢN VẤN ĐÁP: BẢO VỆ LUỒNG HOẠT ĐỘNG DỰ ÁN IOT (Đã cập nhật bảng LICH_SU_HANH_DONG)

Tài liệu này được biên soạn dưới dạng "Kịch bản nói" và "Hỏi - Đáp". Bạn hãy sử dụng các văn phong này để trả lời trôi chảy trước Hội đồng bảo vệ khi các thầy cô hỏi về luồng đi của Data trong dự án.

---

## PHẦN 1: KỊCH BẢN THUYẾT TRÌNH TỔNG QUAN HỆ THỐNG
**Khi thầy cô giải thích: "Em hãy trình bày tổng quan hệ thống của em hoạt động như thế nào?"**

> **🗣 Kịch bản trả lời:**
> "Dạ thưa thầy/cô, hệ thống của em hoạt động trên cơ chế Full-stack khép kín, hoạt động qua 3 tầng (Layer):
> 
> **Thứ nhất là Tầng Phần Cứng (ESP32):** Nhận nhiệm vụ giao tiếp môi trường, cứ 2 giây nó sẽ đọc giá trị Nhiệt độ, Độ ẩm (DHT11) và Ánh sáng (BH1750) sau đó đẩy gói dữ liệu lên trạm trung chuyển MQTT. Đồng thời nó có code liên tục lắng nghe để bật/tắt thiết bị đèn (thông qua Relay).
> 
> **Thứ hai là Tầng Xử lý Trung Gian (MQTT & Node.js):** Em sử dụng MQTT Broker làm kênh truyền tin nhẹ và nhanh nhất cho IoT. Phía sau nó là một server Node.js do em tự code chạy ngầm. Server này bắt tất cả dữ liệu MQTT để ghi thẳng vào Database (MySQL) lưu trữ vĩnh viễn, sau đó nó đẩy ngay dữ liệu đó lên giao diện Web thông qua chuẩn WebSocket tải siêu nhanh.
> 
> **Thứ ba là Tầng Giao diện Người Mọi (Next.js):** Lớp Web Dashboard hiển thị các biểu đồ biến thiên không bị giật lag nhờ Socket. Tại đây, khi người dùng thao tác bấm 1 nút bật đèn, tín hiệu sẽ chạy ngược từ Web, chui xuống Server Node.js, đẩy qua MQTT và về con vi điều khiển ESP32."

---

## PHẦN 2: CHIA NHỎ 2 LUỒNG CHẠY ĐỂ BẢO VỆ

Nếu thầy cô hỏi sâu vào từng tính năng, hãy bám sát 2 mô hình sau:

### 🌟 Luồng 1: Luồng Dữ Liệu Cảm Biến Đi Lên (Sensor Data Flow)
**Câu hỏi dự kiến:** *"Luồng dữ liệu đi từ cái cảm biến cho tới khi nó hiện lên trên biểu đồ trên web của em như thế nào? Chạy qua những file nào?"*

> **🗣 Tư duy & Trả lời từng bước:**
> 1. **Bước 1 (Thu thập):** Tại file phần cứng `main.cpp` (Hàm `updateSensors`), ESP32 đọc cảm biến. Điểm đặc biệt của em là không dùng hàm `delay()` để tránh treo mạch, thay vào đó dùng `millis()` kẹp thời gian chờ 2s. Nó đóng gói thành chuỗi JSON và lệnh `publish` lên topic `esp32/sensors`.
> 2. **Bước 2 (Ghi nhận & Lưu trữ):** Tín hiệu bay lên trung tâm. Ở file `server.js` (dòng 168), máy chủ Node.js của em phát hiện có tiếng gõ cửa ở topic `sensors`. Nó lập tức gọi 1 query SQL bóc 3 con số Nhiệt/Ẩm/Sáng chèn (INSERT) vào bảng `LICH_SU_DU_LIEU` của MySQL để làm báo cáo sau này.
> 3. **Bước 3 (Hiển thị Real-time):** Cũng tại `server.js`, ngay sau khi ghi file xong để tránh việc Web phải Load lại tốn tài nguyên, em dùng lệnh `io.emit('sensor_data')` qua giao thức Socket.io. Trang `page.tsx` ở giao diện nghe thấy, và tống số liệu mới đó trực tiếp vào cái đuôi của Biểu đồ. Mọi thứ diễn ra trong chưa tới **0.2 giây**!

---

### 🌟 Luồng 2: Luồng Điều Khiển Thiết Bị & Khử Lỗi Timeout (Rất quan trọng để biểu diễn)
**Câu hỏi dự kiến:** *"Thế lúc thầy nhấn nút bật cái bóng đèn từ xa trên màn hình, cấu trúc code em đi như thế nào để bóng đèn sáng? Lỡ đứt mạng thì sao?"*

> **🗣 Tư duy & Trả lời từng bước:**
> 1. **Bước 1 (Giao diện Web phát lệnh):** Dạ, khi thầy cô bấm nút trên Website (`page.tsx`), biểu tượng nút sẽ chuyển luôn thành thanh Loading (hiện trạng thái đang Waiting) nhằm báo hiệu đang xử lý chứ không nháy sáng luôn. Web gọi một gói tin API gửi tín hiệu ý định xuống Server.
> 2. **Bước 2 (Chuyển lệnh xuống phần cứng):** `server.js` bắt được, nó gọi MQTT publish vào topic `esp32/control`. Cũng đúng lúc này, nó cẩn thận ghi chú vào Database: *"Lệnh này đang ở trạng thái Waiting nha, chưa biết sống chết!"*. Kết quả được ghi vào bảng `LICH_SU_HANH_DONG`.
> 3. **Bước 3 (ESP32 Xử lý):** Phần cứng `main.cpp` nhận được lệnh, nó cấp điện đẩy chân cắm I/O cho dòng điện đi qua chốt Relay mở đèn. **Nhưng chưa dừng lại ở đó!** Nó sẽ lập tức gọi hàm `publishStatus` để báo mạng trả ngược lại Server Node.js một câu: *“Tôi đã bật rồi!”*.
> 4. **Bước 4 (Dọn dẹp DB & Web Update):** `server.js` thấy tiếng vọng lên, nó sửa cái trạng thái "Waiting" trong bảng `LICH_SU_HANH_DONG` của Database thành "Success" (Thành công). Và gọi Socket chọc lên web: *"Bật được rồi nha!"*. Lúc này màn hình tự động chuyển sang màu sáng xanh.
> 
> **(Bổ sung BẢO MẬT & BÙ LỖI TIMEOUT - Đây là điểm ĂN ĐIỂM TỐI ĐA):**
> Thưa các thầy cô, vì đây là mạng IoT nên thường xuyên rớt mạng wifi hoặc ESP bị mất điện. Dự án của em cung cấp tính năng **Đếm ngược chịu lỗi 5s**. 
> Nếu sau khi thực hiện **Bước 1** mà đếm đúng 5 giây, Web không nghe thấy câu chốt ở **Bước 4**. Giao diện UI sẽ tự kích hoạt cơ chế Timeout, tự gọi API `/report-failure` báo cáo vào bảng `LICH_SU_HANH_DONG` của Database, và ép công tắc Đèn trên giao diện NHẢ LẠI trạng thái tắt ban đầu! Đảm bảo thông tin trên màn hình đồng bộ 100% với thực tế."

---

## PHẦN 3: CÁC CÂU HỎI XOÁY CỦA HỘI ĐỒNG (FAQ)

**❓ Câu hỏi 1:** Tại sao không giao tiếp trực tiếp Next.js với MQTT Broker mà phải xây ghép qua thằng `server.js` chạy Node.js?
* **Đáp:** Dạ vì kiến trúc Next.js (cụ thể là Serverless API của Vercel) không thể duy trì kết nối mạng thời gian thực (như WebSockets hoặc MQTT Client ngầm) liên tục 24/7. Việc em chạy một file `server.js` (Express/Custom Node) sẽ giúp nó trở thành một "Background Worker" chuyên trách nghe MQTT cả ngày, bảo vệ cơ sở dữ liệu MySQL không kết nối chập chờn, sau đó thông báo lên web bằng WebSockets, làm giảm tải cho luồng UI Next.js ạ.

**❓ Câu hỏi 2:** Em xử lý hàm thời gian chống giật lag cho ESP32 ra sao? Nếu gửi dữ liệu liên tục có bị tràn bộ nhớ không?
* **Đáp:** Dạ em thiết kế hàm theo cơ chế Non-block (Không nghẽn luồng). Thay vào đó dùng bộ đếm bộ nhớ `millis()`. Chip chỉ tính khoảng chênh lệch thời gian `(hiện_tại - trước_đó > 2s)` rồi mới nhảy vào đọc cảm biến. CPU lúc nào cũng quay liên tục để canh tin nhắn MQTT.

**❓ Câu hỏi 3:** Tại sao em cần có 2 bảng Database: Lịch sử môi trường và Nhật ký hành động?
* **Đáp:** Để đối chiếu (trace-log) chéo nhau ạ. Bảng `LICH_SU_DU_LIEU` lưu thông số môi trường, còn bảng `LICH_SU_HANH_DONG` lưu giữ vết điều khiển. Việc này giúp truy vết các lệnh hư hỏng/không thực thi, phát hiện sự cố phần cứng kịp thời ạ.
