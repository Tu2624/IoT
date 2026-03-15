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
  - `esp32/control` — subscribes; accepts JSON string commands: `"wave_on"`, `"wave_off"`, `"on"`, `"off"`, `"status"`
  - `esp32/status` — publishes `{"status":"online", "wave":bool, "sensors":bool, "trigger":"..."}` on connect and after each control command

## Dependencies

Managed via `platformio.ini`:
- `adafruit/DHT sensor library@^1.4.7`
- `claws/BH1750@^1.3.0`
- `knolleary/PubSubClient@^2.8`

## Architecture

All logic is in `src/main.cpp`. The `loop()` uses non-blocking timing (`millis()`) to run three independent tasks concurrently:

1. **`updateSensors()`** — reads DHT11 + BH1750 every 2s, publishes to `esp32/sensors`
2. **`updateWave()`** — 4-step cycle (BH→DHT→SYS→off) at 150ms per step; skips when `waveEnabled=false`
3. **`reconnect()` / `reconnectWiFi()`** — non-blocking reconnect with 5s retry; subscribes to `esp32/control` and calls `publishStatus("connect")` on successful MQTT connect
4. **`mqttCallback()`** — handles incoming control commands, toggling `waveEnabled`/`sysLedState` and publishing status after each command

WiFi credentials (ssid/password) and MQTT broker address/credentials are hardcoded constants at the top of `main.cpp`.
