# ESP32 IoT Firmware

Firmware cho ESP32 sử dụng PlatformIO + Arduino framework. Đọc dữ liệu từ cảm biến DHT11 (nhiệt độ/độ ẩm) và BH1750 (ánh sáng), gửi dữ liệu JSON qua MQTT, và chạy hiệu ứng sóng LED không chặn (non-blocking).

## Phần cứng

| Linh kiện | Kết nối |
|---|---|
| ESP32 Dev Module | — |
| DHT11 | Data → GPIO 4, LED → GPIO 27 |
| BH1750 | SDA → GPIO 21, SCL → GPIO 22, LED → GPIO 26 |
| LED hệ thống | GPIO 5 |

## Thư viện

Được quản lý qua `platformio.ini`:
- `adafruit/DHT sensor library@^1.4.7`
- `claws/BH1750@^1.3.0`
- `knolleary/PubSubClient@^2.8`

## Cấu hình

Chỉnh sửa các hằng số ở đầu `src/main.cpp`:

```cpp
const char* ssid        = "TênWiFi";
const char* password    = "MatKhauWiFi";
const char* mqtt_server = "192.168.1.x";   // IP broker MQTT
```

## Build & Flash

```bash
# Build firmware
pio run

# Nạp firmware lên ESP32
pio run --target upload

# Mở Serial Monitor (115200 baud)
pio device monitor

# Build + nạp + monitor cùng lúc
pio run --target upload && pio device monitor

# Xóa file build
pio run --target clean
```

## MQTT Topics

| Topic | Hướng | Mô tả |
|---|---|---|
| `esp32/sensors` | Publish | Dữ liệu cảm biến mỗi 2 giây: `{"temp":X, "hum":X, "lux":X}` |
| `esp32/control` | Subscribe | Nhận lệnh điều khiển |
| `esp32/status` | Publish | Trạng thái thiết bị sau mỗi lệnh |

### Lệnh điều khiển (`esp32/control`)

| Lệnh | Chức năng |
|---|---|
| `on` | Bật cảm biến — bắt đầu đọc và gửi dữ liệu |
| `off` | Tắt cảm biến — dừng đọc và gửi dữ liệu |
| `wave_on` | Bật hiệu ứng sóng LED |
| `wave_off` | Tắt hiệu ứng sóng LED |
| `status` | Yêu cầu gửi trạng thái hiện tại |

**Ví dụ gửi lệnh (Windows PowerShell):**
```powershell
mosquitto_pub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/control" -m '{"cmd":"off"}'
```

**Theo dõi trạng thái:**
```powershell
mosquitto_sub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/status" -v
```

## Kiến trúc

Toàn bộ logic nằm trong `src/main.cpp`. Vòng lặp `loop()` dùng `millis()` để chạy các tác vụ song song không chặn:

- **`updateSensors()`** — Đọc DHT11 + BH1750 mỗi 2 giây, gửi lên `esp32/sensors`. Hiển thị `[SENSOR] Waiting for valid data...` nếu cảm biến chưa trả về dữ liệu hợp lệ.
- **`updateWave()`** — Chu kỳ sóng LED 4 bước (BH→DHT→SYS→tắt) mỗi 150ms.
- **`processPendingCmd()`** — Hàng đợi lệnh `on`/`off`: thử lại publish mỗi 5 giây cho đến khi `client.publish()` thành công.
- **`reconnect()` / `reconnectWiFi()`** — Tự động kết nối lại WiFi và MQTT, thử lại mỗi 5 giây.


  Window 1 — Data Sensor (watch live readings):
  	mosquitto_sub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/sensors" -v 

  
  Window 2 — Device Status (watch state changes)

	mosquitto_sub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/status" -v 


  Window 3 — Control Command (run one at a time)

	mosquitto_pub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/control" -m '{"cmd":"wave_off"' 
  	mosquitto_pub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/control" -m '{"cmd":"wave_on"}'      
	mosquitto_pub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/control" -m '{"cmd":"off"'   
  	mosquitto_pub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/control" -m '{"cmd":"on"'     

                                                                                                         