# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ESP32 IoT firmware (PlatformIO + Arduino framework) that reads DHT11 (temperature/humidity) and BH1750 (light) sensors, publishes JSON data over MQTT, and runs a non-blocking LED wave animation.

## Build & Flash Commands

```bash
# Build firmware
pio run

# Upload to ESP32
pio run --target upload

# Open serial monitor (115200 baud)
pio device monitor

# Build + upload + monitor in one step
pio run --target upload && pio device monitor

# Clean build artifacts
pio run --target clean
```

## Hardware Configuration

- **Board**: ESP32 Dev Module (`esp32dev`)
- **DHT11**: Data pin GPIO 4, LED indicator GPIO 27
- **BH1750**: I2C on SDA=GPIO 21 / SCL=GPIO 22, LED indicator GPIO 26
- **System LED**: GPIO 5
- **MQTT broker**: `172.20.10.2:2004` (mobile hotspot IP — update when network changes)
- **MQTT client ID**: `ESP32_Async_Client`, credentials hardcoded in `reconnect()`
- **MQTT topics**:
  - `esp32/sensors` — publishes `{"temp":X, "hum":X, "lux":X}` every 2 seconds
  - `esp32/control` — subscribes; accepts commands: `lights_on`, `lights_off`, `wave_on`, `wave_off`, `blink_on`, `blink_off`, `led_bh_on/off`, `led_dht_on/off`, `led_sys_on/off`, `on` (sensors), `off` (sensors), `status`
  - `esp32/status` — publishes `{"status":"online", "mode":"static|wave|blink", "sensors":bool, "trigger":"..."}` on connect and after each control command

## Dependencies

Managed via `platformio.ini`:
- `adafruit/DHT sensor library@^1.4.7`
- `claws/BH1750@^1.3.0`
- `knolleary/PubSubClient@^2.8`

## Dashboard (`iot-dashboard/`)

Vue 3 + Vite frontend prototype. Currently uses **mock data** — no live MQTT connection yet. Planned backend: Node.js + MQTT + MySQL (see `iot-dashboard/README.md` for DB schema).

```bash
cd iot-dashboard
npm install       # first time only
npm run dev       # dev server at http://localhost:5173
npm run build     # production build
```

## Architecture

All logic is in `src/main.cpp`. The `loop()` uses non-blocking timing (`millis()`) to run independent tasks concurrently:

1. **`updateSensors()`** — reads DHT11 + BH1750 every 2s, publishes to `esp32/sensors`; skips when `sensorsEnabled=false`
2. **`updateWave()`** — 4-step cycle (BH→DHT→SYS→off) at 150ms per step; only runs when `ledMode == LED_WAVE`
3. **`updateBlink()`** — all 3 LEDs toggle together at 500ms; only runs when `ledMode == LED_BLINK`
4. **`reconnect()` / `reconnectWiFi()`** — non-blocking MQTT reconnect with 5s retry; subscribes to `esp32/control` and calls `publishStatus("connect")` on success (`reconnectWiFi` blocks up to 10s)
5. **`mqttCallback()`** — handles all LED and sensor commands; `on` immediately publishes `trigger:"waiting"` then queues `CMD_ON`; `off` only queues `CMD_OFF` (no immediate publish). **strstr order is critical** — all specific `*_on`/`*_off` commands must appear before the generic `on`/`off` sensor fallbacks
6. **`processPendingCmd()`** — retries `publishStatus()` every 5s until the queued `on`/`off` command is confirmed published

### LED mode system
`enum LedMode { LED_STATIC, LED_WAVE, LED_BLINK }` — only one mode active at a time. Default is `LED_STATIC` with `ledStates[3] = {true, true, true}` (all on at boot). `applyStaticLeds()` writes `ledStates[]` to GPIO and is called whenever switching to `LED_STATIC`. Individual LED commands (`led_bh_on` etc.) always switch to `LED_STATIC` first.

WiFi credentials (ssid/password) and MQTT broker address/credentials are hardcoded constants at the top of `main.cpp`.

## MQTT Testing

```bash
# Watch live sensor readings
mosquitto_sub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/sensors" -v

# Watch device status changes
mosquitto_sub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/status" -v

# Send a control command (plain string, not JSON)
mosquitto_pub -h 172.20.10.2 -p 2004 -u B22DCPT244 -P 123456 -t "esp32/control" -m "wave_on"
```
