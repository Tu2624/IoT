# 💻 HƯỚNG DẪN ĐỌC HIỂU CODE MÃ NGUỒN TỪ A-Z

Tài liệu này không nói lý thuyết nữa, mà sẽ "cầm tay chỉ việc", hướng dẫn bạn mở đúng file, nhìn vào dòng code cụ thể, và giải thích cú pháp dòng code đó chạy như thế nào để bạn **thực sự hiểu được bản chất code**.

---

## 1. CÁC ĐIỂM BAO QUÁT (ENTRY POINTS) CẦN ĐỌC TRƯỚC
Khi nhìn vào một dự án lạ, đừng đọc từ trên xuống dưới. Hãy đọc theo thứ tự sau:

1. **Đọc phần cứng:** Mở file `src/main.cpp` kéo hẳn xuống cuối file tìm hàm `setup()` và `loop()`. Đó là điểm xuất phát.
2. **Đọc backend:** Mở file `web-dashboard/server.js` kéo xuống hàm `io.on('connection')` và `mqttClient.on('message')`. 
3. **Đọc giao diện:** Mở trang muốn xem (VD: `web-dashboard/src/app/page.tsx`), đi tìm chỗ khai báo `useState` và móc sự kiện `useEffect`.

---

## 2. PHÂN TÍCH NHỮNG ĐOẠN CODE CỐT LÕI NHẤT

### 🛠 A. Trong Phần Cứng (`src/main.cpp`)

**Hàm `mqttCallback(char* topic, byte* payload, ...)` (Dòng ~83):**
*   **Chức năng:** Hàm này sẽ tự động bị giật (trigger) mỗi khi web đẩy lệnh điều khiển xuống.
*   **Giải nghĩa code:**
    ```cpp
    // Dòng này sử dụng thư viện ArduinoJson để bóc tách cái chuỗi thô của Web gửi xuống (payload)
    // biến nó thành 1 mảng JSON dễ đọc (biến doc).
    StaticJsonDocument doc; 
    deserializeJson(doc, payload, length); 
    
    // Tìm chìa khoá "cmd" (command/lệnh). Lệnh "led" là điều khiển 1 đèn, lệnh "all_lights" là tất cả.
    const char* cmd = doc["cmd"]; 
    
    // Nếu mảng nhả xuống là: { "cmd": "led", "target": "humi", "state": 1 }
    // Thì "target" là đèn ẩm, state 1 là Bật. Code sẽ nhảy vào nhánh IF xử lý bật đèn ẩm.
    int state = doc["state"]; 
    ledStates[2] = (state == 1); 
    applyStaticLeds(); // Gọi hàm ép chân vật lý đẩy điện lên 3.3V sáng đèn
    ```

**Hàm `updateSensors()` (Dòng ~199):**
*   **Giải nghĩa code:**
    ```cpp
    // Hàm millis() của ESP32 trả về số mili-giây kể từ lúc cắm điện.
    // So sánh xem đã trôi qua 2000ms (2 giây) kể từ lần đọc trước chưa. Tránh việc code bị đứng yên.
    if (currentMillis - lastSensorTime >= sensorInterval) { 
        
        // Gọi thư viện dht và bh1750 đọc ra dạng số thập phân.
        float t = dht.readTemperature(); 
        float lux = lightMeter.readLightLevel(); 
        
        // Để gửi được số qua MQTT, nó không truyền số thẳng được mà phải bọc thành dạng Chữ (String/Char) ghép lệnh JSON.
        // Cú pháp {"temp": 25.1, "humi": 60.5, "lux": 100}
        char buffer[80]; 
        snprintf(buffer, sizeof(buffer), "{\"temp\":%.1f,\"humi\":%.1f,\"lux\":%.1f}", t, h, lux);
        
        client.publish(TOPIC_SENSORS, buffer); // Bắn chuỗi chữ vừa ghép lên Mạng.
    }
    ```

---

### 🌐 B. Trong Máy Chủ Server (`web-dashboard/server.js`)

File này sử dụng cú pháp của Node.js (Asynchronous/Bất đồng bộ). Rất nhiều hàm `async/await` được dùng.

**Bắt Data Cảm biến gửi lên (`mqttClient.on('message'`) - Dòng ~162:**
*   **Giải nghĩa code:**
    ```javascript
    mqttClient.on('message', async (topic, message) => {
        // message lúc này đang là Buffer byte, phải toString() để trả về chữ (VD: {"temp":25...})
        const payload = message.toString();
        const data = JSON.parse(payload); // Parse chữ thành Object Object (Biến) của Javascript.
        
        // Nếu Data đăng trển Kênh sensors (ESP32 đo đạc được)
        if (topic === 'esp32/sensors') {
           const { temp, humi, lux } = data; // Tách các biến
           
           // pool.execute là lệnh chọc thẳng vào MySQL.
           // Nó không ghép chuỗi chữ bằng dấu "+" (vì dễ bị SQL Injection hack).
           // Thay vào đó dùng dấu chấm "?" sau đó truyền mảng mảng số liệu ngay kế bên. 
           const [result] = await pool.execute('INSERT INTO LICH_SU_DU_LIEU (temp, humi, lux) VALUES (?, ?, ?)', [temp, humi, lux]);
           
           // Ngay sau đó phát Socket (âm thanh/loa phường) lan toả toàn bộ Web báo là "Tui vừa có số mới nè Web ơi vẽ đi".
           io.emit('sensor_data', { id: result.insertId, temp, humi, lux }); 
        }
    });
    ```

---

### 🎨 C. Code Giao Diện Người Dùng Frontend (Next.js/React - App Router)

**Ở trang bảng Lịch sử Cảm biến (`src/app/data-sensor/page.tsx`):**
Web hiển thị ra làm sao?
*   **Giải nghĩa Code cơ chế lấy Dữ liệu:**
    ```typescript
    // Dùng hàm useEffect để CÁI LÚC VỪA VÀO TRANG MỘT PHÁT là nó chạy ngầm tải Data.
    useEffect(() => {
       fetchData(); 
    }, [page, searchTerm, searchField]); 
    // Các biến trong mảng ngặc vuông: Nếu 1 trong số thằng này thay đổi (VD người dùng lật trang, gõ tìm kiếm) thì chạy lại hàm fetchData ở trên ngay.
    
    // Hàm fetchData sử dụng Fetch HTTP GET (tương đương Gõ URL lên trình duyệt)
    async function fetchData() {
       // Nó tự tạo đường dẫn query gọi xuống thư mục "api/sensors/list"
       const res = await fetch(`/api/sensors/list?page=${page}&limit=${itemsPerPage}&search=${searchTerm}`);
       const json = await res.json();
       setData(json.data); // Nhét cái đống dữ liệu đó vào biến ảo State. Giao diện sẽ tự động quét cái data này vẽ thành cái Table.
    }
    ```

**Ở trang Nút bấm (`src/app/page.tsx`):**
*   **Giải nghĩa Code kết nối cái mạch:**
    ```typescript
    // Khởi tạo Socket Client cắm vòi nghe ngóng từ ông server.js
    useEffect(() => {
        const socketIo = io('http://localhost:3000'); 
        
        // Hễ ông máy chủ la hét 'sensor_data' thì chụp lấy gắn vào đồ thị Chart
        socketIo.on('sensor_data', (newData) => { ... });
    });
    
    // Khi nhấn nút Bật/Tắt bóng đèn ẩm:
    const handleToggleHumi = () => {
        // Đứt mạng thì éo cho bấm
        if (!isMqttConnected) return; 
        
        // Đổi biểu tượng nút thành "Waiting.../spinner quay mòng mòng"
        updateWaiting('led_humi', true);
        
        // Hét Socket ngược lên trên Server:
        // Ê, gửi dùm tui cái chuỗi JSON này qua MQTT Topic Control
        socket?.emit('control_device', { cmd: 'led', target: 'humi', state: isLight2On ? 0 : 1 });
        
        // Kích hoạt quả bom hẹn giờ Timeout 5 giây:
        setTimeout(() => {
            if(vẫn_đang_quay) { // 5s rồi vẫn quay? Lỗi mẹ rồi! Gây ra bởi cúp điện hoặc tạch còi.
               alert("Timeout!");
               // Nhả lại nút ban đầu.
               // Và gọi cục /report-failure lưu lỗi mạng Database!
            }
        }, 5000);
    }
    ```

---

## 3. MẸO VẶNG ĐỂ HIỂU CODE NHANH KHI ĐỌC
1. **Theo dõi dòng đi của Tên BIẾN (`cmd`, `target`, `state`):** Hãy xem file `page.tsx` đóng gói `{cmd: "led", target: "humi"}` như thế nào, sau đó mở file `main.cpp` lên tìm đúng chữ `"cmd"`, `"target"`. Cứ thế lần theo sợi chỉ.
2. **`console.log()` hoặc `Serial.print()` là vua:** Nếu bạn không biết dòng đó nó ra cái ma trận gì, cứ bốc nó cho vào Log. Ở C++ thì `Serial.println(doc["cmd"])`, ở Nodejs thì `console.log(thong_so)`. Nhìn kết quả in ra màn hình sẽ dễ ngộ nhận ra luồng hơn.
3. Không cần thuộc lòng các cú pháp `await`, `async`, `useState`. Chỉ cần nhớ: 
   - `useState` là cục bộ giúp web biến đổi màu sắc không tải lại trang.
   - `await` là "Bắt buộc điếu thuốc cắm đây phải hút xong mới làm việc tiếp" (Chờ Server MySQL đồng bộ xong để lấy Data, chứ không trả về mã lỗi vội).
