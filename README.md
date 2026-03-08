# ESP32 IoT Sensor Node

Project đọc dữ liệu môi trường từ ESP32 và gửi lên MQTT broker (Mosquitto local).

---

## Phần cứng

| Linh kiện | Chân kết nối |
|-----------|--------------|
| DHT11 (nhiệt độ, độ ẩm) | GPIO 4 |
| BH1750 (ánh sáng) | SDA: GPIO 21, SCL: GPIO 22 |
| LED DHT | GPIO 27 |
| LED BH1750 | GPIO 26 |
| LED System | GPIO 5 |

---

## Thư viện sử dụng

- `WiFi.h` — kết nối WiFi
- `PubSubClient` — giao tiếp MQTT
- `DHT sensor library` — đọc DHT11
- `BH1750` — đọc cảm biến ánh sáng

---

## Cấu hình

Chỉnh các thông số trong `src/main.cpp`:

```cpp
const char* ssid        = "phong 501";       // Tên WiFi
const char* password    = "23456789";         // Mật khẩu WiFi
const char* mqtt_server = "192.168.5.102";   // IP máy chủ Mosquitto
```

MQTT port: `2004`
MQTT username: `B22DCPT244`
MQTT password: `123456`

---

## Chức năng

### Đọc cảm biến (mỗi 2 giây)
Dữ liệu được publish lên topic `esp32/sensors` dưới dạng JSON:
```json
{"temp": 27.9, "hum": 68.6, "lux": 1.7}
```

### Hiệu ứng sóng LED
3 LED chạy sóng tuần tự (BH → DHT → SYS → tắt) mỗi 150ms, hoàn toàn non-blocking.

### Tự động kết nối lại
- **WiFi:** tự reconnect nếu mất kết nối
- **MQTT:** thử kết nối lại mỗi 5 giây nếu mất kết nối

---

## Cài đặt Mosquitto

1. Cài Mosquitto: https://mosquitto.org/download/
2. Thêm vào cuối `mosquitto.conf`:
```
listener 2004 0.0.0.0
allow_anonymous false
password_file C:\Program Files\mosquitto\passwd
```
3. Tạo user:
```bash
mosquitto_passwd -c "C:\Program Files\mosquitto\passwd" B22DCPT244
```
4. Cấp quyền và chạy service:
```bash
icacls "C:\Program Files\mosquitto\passwd" /grant "NETWORK SERVICE:(R)"
icacls "C:\Program Files\mosquitto\mosquitto.conf" /grant "NETWORK SERVICE:(R)"
net start mosquitto
```

---

## Kiểm tra dữ liệu nhận được

```bash
mosquitto_sub -h localhost -p 2004 -t "esp32/sensors" -u B22DCPT244 -P 123456
```
