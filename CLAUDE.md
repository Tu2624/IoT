# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ESP32 IoT firmware (PlatformIO + Arduino framework) + Next.js 16 web dashboard. The firmware reads DHT11 (temperature/humidity) and BH1750 (light) sensors, publishes JSON over MQTT, and controls 3 LEDs. The dashboard bridges MQTT → MySQL → browser via a custom Node server with Socket.io.

## Firmware (`src/`)

### Build & Flash Commands

```bash
pio run                                          # Build
pio run --target upload                          # Flash to ESP32
pio device monitor                               # Serial monitor (115200 baud)
pio run --target upload && pio device monitor    # Flash + monitor
pio run --target clean                           # Clean build artifacts
```

### Hardware Configuration

- **Board**: ESP32 Dev Module (`esp32dev`)
- **DHT11**: Data pin GPIO 4
- **BH1750**: I2C — SDA=GPIO 21, SCL=GPIO 22
- **LEDs**: `LED_BH`=GPIO 26, `LED_TEMP`=GPIO 27, `LED_HUMI`=GPIO 5
- **`ledStates[3]`** index mapping: `[0]`=BH, `[1]`=TEMP, `[2]`=HUMI

### Credentials & Config

WiFi and MQTT credentials live in `src/config.h` (not in `main.cpp`):
- SSID/password, `mqtt_server`, `mqtt_port`, `mqtt_user`, `mqtt_pass`
- MQTT client ID: `ESP32_Dashboard_Client`

### MQTT Topics & Protocol

- `esp32/sensors` — publishes `{"temp":X,"humi":X,"lux":X}` every 2s
- `esp32/status` — publishes `{"status":"online","mode":"static|wave|blink","heap":N,"trigger":"..."}` on connect and after each command; LWT publishes `{"status":"offline","trigger":"lwt"}`
- `esp32/control` — **receives JSON commands** (not plain strings):

| Command | Payload |
|---|---|
| Switch LED mode | `{"cmd":"mode","val":"wave\|blink\|static"}` |
| Toggle one LED | `{"cmd":"led","target":"bh\|temp\|humi","state":0\|1}` |
| All LEDs on/off | `{"cmd":"all_lights","state":0\|1}` |
| Toggle a sensor | `{"cmd":"sensor","target":"temp\|humi\|lux\|all","state":0\|1}` |

### Architecture (`src/main.cpp`)

All logic is in one file. `loop()` runs these non-blocking tasks via `millis()`:

- **`updateSensors()`** — reads sensors every 2s, skips when `sensorsEnabled=false`; individual channels controlled by `readTemp`/`readHumi`/`readLux`
- **`updateWave()`** — 4-step cycle (BH→TEMP→HUMI→off) at 150ms per step; only when `ledMode == LED_WAVE`
- **`updateBlink()`** — all 3 LEDs toggle at 500ms; only when `ledMode == LED_BLINK`
- **`reconnectWiFi()`** — non-blocking check every 5s using `WiFi.reconnect()`
- **`reconnectMQTT()`** — non-blocking retry every 5s; subscribes to `esp32/control` and calls `publishStatus("connect")` on success
- **`mqttCallback()`** — parses JSON payload, dispatches to command handlers; individual LED commands always switch to `LED_STATIC` first
- **`printDiagnostics()`** — logs uptime + free heap every 10s

**LED mode system**: `enum LedMode { LED_STATIC, LED_WAVE, LED_BLINK }`. Default is `LED_STATIC` with all LEDs on. `applyStaticLeds()` writes `ledStates[]` to GPIO and is called when switching to `LED_STATIC`.

### MQTT Testing

```bash
mosquitto_sub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/sensors" -v
mosquitto_sub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/status" -v
mosquitto_pub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/control" -m '{"cmd":"mode","val":"wave"}'
```

## Web Dashboard (`web-dashboard/`)

Next.js 16 + Socket.io + MQTT + MySQL. **Important**: This project uses Next.js 16, which has breaking changes from older versions. Read `node_modules/next/dist/docs/` before writing Next.js-specific code.

### Commands

```bash
cd web-dashboard
npm install          # First time
npm run dev          # Starts custom server (node server.js) on port 3000
npm run build        # Production build
npm run lint         # ESLint
```

### Setup

1. Configure `web-dashboard/.env.local` with DB and MQTT credentials (see existing file for all keys).
2. Initialize the database: `node init-db.js` from inside `web-dashboard/` — reads `../schema.sql` from the project root.

### Data Flow

```
ESP32 → MQTT broker → server.js (Node) → MySQL INSERT
                                        → Socket.io emit → browser
browser → Socket.io emit → server.js → MQTT publish → ESP32
```

### Architecture

- **`server.js`** — custom HTTP server wrapping Next.js; owns the MQTT client, Socket.io server, and DB writes. Emits `sensor_data`, `mqtt_status`, `device_status` events to connected browsers. Listens for `control_device` from browsers and forwards as JSON to `esp32/control`.
- **`src/lib/db.ts`** — MySQL2 connection pool (reads env vars).
- **`src/app/api/`** — REST endpoints for historical data (`/api/sensors/list` → `LICH_SU_DU_LIEU`, `/api/actions/list` → `LICH_SU_HANH_DONG`).
- **`src/app/page.tsx`** — main dashboard: real-time charts via Socket.io, LED toggles, sensor toggles, connection status.
- **`src/app/data-sensor/page.tsx`** — paginated sensor history table with CSV export.
- **`src/app/action-history/page.tsx`** — action/status log from `LICH_SU_HANH_DONG`.

### Database Schema (`schema.sql` at project root)

Three tables in `iot_dashboard` database:
- `LICH_SU_DU_LIEU` — sensor readings (`temp`, `humi`, `lux`, `recorded_date`)
- `LICH_SU_HANH_DONG` — device status/action log (`device_name`, `status`, `description`, `report_date`)
- `NGUOI_DUNG` — users (`username`, `full_name`, `student_id`, `role`)

### Dependencies

- `adafruit/DHT sensor library@^1.4.4`
- `adafruit/Adafruit Unified Sensor@^1.1.9`
- `claws/BH1750@^1.0.0`
- `knolleary/PubSubClient@^2.8`
- `bblanchon/ArduinoJson@^7.0.4`
