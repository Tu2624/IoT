#include "config.h"
#include <ArduinoJson.h>
#include <BH1750.h>
#include <DHT.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <Wire.h>
#include <rom/rtc.h>

#define TOPIC_SENSORS "esp32/sensors"
#define TOPIC_CONTROL "esp32/control"
#define TOPIC_STATUS "esp32/status"

unsigned long lastSensorTime = 0;
const long sensorInterval = 2000;

unsigned long lastWaveTime = 0;
unsigned long lastBlinkTime = 0;
const long waveSpeed = 150;
const long blinkSpeed = 500;
int currentLedStep = 0;
bool blinkState = false;

unsigned long lastReconnectAttempt = 0;
const long reconnectInterval = 5000;

unsigned long lastMonitorTime = 0;
const long monitorInterval = 10000;
unsigned long lastWiFiCheckTime = 0;
const long wifiCheckInterval = 5000;

enum LedMode { LED_STATIC, LED_WAVE, LED_BLINK };
LedMode ledMode = LED_STATIC;

constexpr int LED_COUNT = 5;
const int LED_PINS[LED_COUNT] = {LED_BH_PIN, LED_TEMP_PIN, LED_HUMI_PIN, LED1_PIN, LED2_PIN};

enum LedIndex {
  LED_BH_INDEX = 0,
  LED_TEMP_INDEX,
  LED_HUMI_INDEX,
  LED1_INDEX,
  LED2_INDEX
};

bool ledStates[LED_COUNT] = {true, true, true, true, true};

bool sensorsEnabled = true;
bool readTemp = true;
bool readHumi = true;
bool readLux = true;

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;
WiFiClient espClient;
PubSubClient client(espClient);

void applyStaticLeds() {
  for (int i = 0; i < LED_COUNT; i++) {
    digitalWrite(LED_PINS[i], ledStates[i] ? HIGH : LOW);
  }
}

int getLedIndex(const char *target) {
  if (!target)
    return -1;
  if (strcmp(target, "bh") == 0)
    return LED_BH_INDEX;
  if (strcmp(target, "temp") == 0)
    return LED_TEMP_INDEX;
  if (strcmp(target, "humi") == 0)
    return LED_HUMI_INDEX;
  if (strcmp(target, "led1") == 0)
    return LED1_INDEX;
  if (strcmp(target, "led2") == 0)
    return LED2_INDEX;
  return -1;
}

bool publishStatus(const char *trigger, int state = -1) {
  if (!client.connected())
    return false;
  if (ESP.getFreeHeap() < 8192)
    return false;

  const char *modeStr = (ledMode == LED_WAVE) ? "wave"
                        : (ledMode == LED_BLINK) ? "blink"
                                                 : "static";

  char buffer[256];
  snprintf(buffer, sizeof(buffer),
           "{\"status\":\"online\",\"mode\":\"%s\",\"heap\":%u,\"trigger\":\"%s\","
           "\"led_temp\":%d,\"led_humi\":%d,\"led_bh\":%d,\"led1\":%d,\"led2\":%d}",
           modeStr, ESP.getFreeHeap(), trigger, ledStates[LED_TEMP_INDEX] ? 1 : 0,
           ledStates[LED_HUMI_INDEX] ? 1 : 0, ledStates[LED_BH_INDEX] ? 1 : 0,
           ledStates[LED1_INDEX] ? 1 : 0, ledStates[LED2_INDEX] ? 1 : 0);

  return client.publish(TOPIC_STATUS, buffer);
}

void mqttCallback(char *topic, byte *payload, unsigned int length) {
  if (strcmp(topic, TOPIC_CONTROL) != 0)
    return;

  static JsonDocument doc;
  doc.clear();
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print(F("JSON Error: "));
    Serial.println(error.f_str());
    return;
  }

  const char *cmd = doc["cmd"];
  if (!cmd)
    return;

  if (strcmp(cmd, "mode") == 0) {
    const char *val = doc["val"];
    if (strcmp(val, "wave") == 0) {
      ledMode = LED_WAVE;
      currentLedStep = 0;
      publishStatus("mode_wave");
    } else if (strcmp(val, "blink") == 0) {
      ledMode = LED_BLINK;
      blinkState = false;
      lastBlinkTime = 0;
      publishStatus("mode_blink");
    } else {
      ledMode = LED_STATIC;
      applyStaticLeds();
      publishStatus("mode_static");
    }
  } else if (strcmp(cmd, "led") == 0) {
    const char *target = doc["target"];
    int state = doc["state"];
    int ledIndex = getLedIndex(target);

    if (ledIndex < 0)
      return;

    ledMode = LED_STATIC;
    ledStates[ledIndex] = (state == 1);
    applyStaticLeds();

    char triggerName[32];
    snprintf(triggerName, sizeof(triggerName), "led_%s", target);
    publishStatus(triggerName, state);
  } else if (strcmp(cmd, "all_lights") == 0) {
    int state = doc["state"];
    ledMode = LED_STATIC;
    for (int i = 0; i < LED_COUNT; i++) {
      ledStates[i] = (state == 1);
    }
    applyStaticLeds();
    publishStatus(state == 1 ? "lights_all_on" : "lights_all_off", state);
  } else if (strcmp(cmd, "sync") == 0) {
    ledMode = LED_STATIC;
    ledStates[LED_BH_INDEX] = (doc["bh"] == 1);
    ledStates[LED_TEMP_INDEX] = (doc["temp"] == 1);
    ledStates[LED_HUMI_INDEX] = (doc["humi"] == 1);
    ledStates[LED1_INDEX] = (doc["led1"] == 1);
    ledStates[LED2_INDEX] = (doc["led2"] == 1);
    applyStaticLeds();
    publishStatus("sync_done");
  } else if (strcmp(cmd, "sensor") == 0) {
    const char *target = doc["target"];
    int state = doc["state"];

    if (strcmp(target, "temp") == 0)
      readTemp = (state == 1);
    else if (strcmp(target, "humi") == 0)
      readHumi = (state == 1);
    else if (strcmp(target, "lux") == 0)
      readLux = (state == 1);
    else if (strcmp(target, "all") == 0)
      sensorsEnabled = (state == 1);

    publishStatus("sensor_toggled");
  }
}

void updateWave() {
  if (ledMode != LED_WAVE)
    return;

  unsigned long currentMillis = millis();
  if (currentMillis - lastWaveTime >= waveSpeed) {
    lastWaveTime = currentMillis;

    for (int i = 0; i < LED_COUNT; i++) {
      digitalWrite(LED_PINS[i], LOW);
    }

    digitalWrite(LED_PINS[currentLedStep], HIGH);
    currentLedStep = (currentLedStep + 1) % LED_COUNT;
  }
}

void updateBlink() {
  if (ledMode != LED_BLINK)
    return;

  unsigned long currentMillis = millis();
  if (currentMillis - lastBlinkTime >= blinkSpeed) {
    lastBlinkTime = currentMillis;
    blinkState = !blinkState;
    uint8_t level = blinkState ? HIGH : LOW;

    for (int i = 0; i < LED_COUNT; i++) {
      digitalWrite(LED_PINS[i], level);
    }
  }
}

void updateSensors() {
  if (!sensorsEnabled)
    return;

  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorTime >= sensorInterval) {
    lastSensorTime = currentMillis;

    float h = readHumi ? dht.readHumidity() : 0.0;
    float t = readTemp ? dht.readTemperature() : 0.0;
    float lux = readLux ? lightMeter.readLightLevel() : 0.0;

    bool tempValid = readTemp ? !isnan(t) : true;
    bool humiValid = readHumi ? !isnan(h) : true;
    bool luxValid = readLux ? (lux >= 0) : true;

    if (!tempValid || !humiValid || !luxValid)
      return;

    if (client.connected() && ESP.getFreeHeap() >= 8192) {
      char buffer[80];
      snprintf(buffer, sizeof(buffer),
               "{\"temp\":%.1f,\"humi\":%.1f,\"lux\":%.1f}", t, h, lux);
      client.publish(TOPIC_SENSORS, buffer);
    }
  }
}

void reconnectWiFi() {
  unsigned long currentMillis = millis();
  if (WiFi.status() != WL_CONNECTED) {
    if (currentMillis - lastWiFiCheckTime >= wifiCheckInterval) {
      lastWiFiCheckTime = currentMillis;
      Serial.println(F("WiFi disconnected. Attempting reconnect..."));
      WiFi.disconnect();
      WiFi.reconnect();
    }
  }
}

void reconnectMQTT() {
  unsigned long currentMillis = millis();
  if (!client.connected() && WiFi.status() == WL_CONNECTED) {
    if (currentMillis - lastReconnectAttempt >= reconnectInterval) {
      lastReconnectAttempt = currentMillis;
      Serial.println(F("Attempting MQTT reconnect..."));
      if (client.connect("ESP32_Dashboard_Client", mqtt_user, mqtt_pass,
                         TOPIC_STATUS, 0, true,
                         "{\"status\":\"offline\",\"trigger\":\"lwt\"}")) {
        Serial.println(F("MQTT Connected"));
        client.subscribe(TOPIC_CONTROL);
        publishStatus("connect");
      }
    }
  }
}

void printDiagnostics() {
  unsigned long currentMillis = millis();
  if (currentMillis - lastMonitorTime >= monitorInterval) {
    lastMonitorTime = currentMillis;
    Serial.printf("[SYSTEM] Uptime: %lu s | Free Heap: %u bytes\n",
                  currentMillis / 1000, ESP.getFreeHeap());
  }
}

void checkResetReason(int core) {
  RESET_REASON reason = rtc_get_reset_reason(core);
  Serial.printf("Reset Reason (Core %d): ", core);
  switch (reason) {
  case 1:
    Serial.println(F("POWERON_RESET"));
    break;
  case 3:
    Serial.println(F("SW_RESET"));
    break;
  case 4:
    Serial.println(F("OWDT_RESET"));
    break;
  case 12:
    Serial.println(F("SW_CPU_RESET"));
    break;
  case 14:
    Serial.println(F("TG0WDT_SYS_RESET"));
    break;
  case 15:
    Serial.println(F("BROWNOUT_RESET"));
    break;
  case 16:
    Serial.println(F("RTCWDT_RTC_RESET"));
    break;
  default:
    Serial.println(F("OTHER"));
    break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\n--- ESP32 Starting ---"));
  checkResetReason(0);
  checkResetReason(1);

  for (int i = 0; i < LED_COUNT; i++) {
    pinMode(LED_PINS[i], OUTPUT);
  }
  applyStaticLeds();

  dht.begin();
  Wire.begin(21, 22);
  lightMeter.begin();

  WiFi.mode(WIFI_STA);
  WiFi.setTxPower(WIFI_POWER_15dBm);
  WiFi.begin(ssid, password);
  Serial.println(F("Connecting to WiFi... (non-blocking)"));

  client.setServer(mqtt_server, mqtt_port);
  client.setBufferSize(512);
  client.setCallback(mqttCallback);
}

void loop() {
  reconnectWiFi();
  reconnectMQTT();

  if (client.connected()) {
    client.loop();
  }

  updateWave();
  updateBlink();
  updateSensors();
  printDiagnostics();
}
