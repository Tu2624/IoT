#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>

// --- Cấu hình Pin ---
#define LED_DHT 27
#define LED_BH  26
#define LED_SYS 5
#define DHTPIN  4
#define DHTTYPE DHT11

// --- MQTT Topics ---
#define TOPIC_SENSORS "esp32/sensors"
#define TOPIC_CONTROL "esp32/control"
#define TOPIC_STATUS  "esp32/status"

// --- Thông số cấu hình ---
const char* ssid        = "iPhone";
const char* password    = "88888888";
const char* mqtt_server = "172.20.10.2";

// --- Biến quản lý thời gian (Non-blocking) ---
unsigned long lastSensorTime = 0;
const long sensorInterval = 2000;

unsigned long lastWaveTime = 0;
unsigned long lastReconnectAttempt = 0;
const long reconnectInterval = 5000;
const long waveSpeed = 150;
int currentLedStep = 0;

// --- Trạng thái thiết bị ---
bool waveEnabled = true;
bool sensorsEnabled = true;

enum PendingCmd { CMD_NONE, CMD_ON, CMD_OFF };
PendingCmd pendingCmd = CMD_NONE;
unsigned long lastCmdRetryTime = 0;
const long cmdRetryInterval = 5000;

// Khởi tạo đối tượng
DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;
WiFiClient espClient;
PubSubClient client(espClient);

// --- PUBLISH TRẠNG THÁI ---
bool publishStatus(const char* trigger) {
  char msg[128];
  snprintf(msg, sizeof(msg),
    "{\"status\":\"online\", \"wave\":%s, \"sensors\":%s, \"trigger\":\"%s\"}",
    waveEnabled ? "true" : "false",
    sensorsEnabled ? "true" : "false",
    trigger
  );
  bool ok = client.publish(TOPIC_STATUS, msg);
  Serial.printf("[STATUS] -> %s\n", msg);
  return ok;
}

// --- CALLBACK: XỬ LÝ LỆNH ĐIỀU KHIỂN ---
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char msg[64];
  unsigned int len = (length < sizeof(msg) - 1) ? length : sizeof(msg) - 1;
  memcpy(msg, payload, len);
  msg[len] = '\0';

  Serial.printf("[CONTROL] topic=%s msg=%s\n", topic, msg);

  if (strcmp(topic, TOPIC_CONTROL) != 0) return;

  if (strstr(msg, "wave_on")) {
    waveEnabled = true;
    Serial.println("[CMD] Wave ON");
    publishStatus("cmd_wave_on");

  } else if (strstr(msg, "wave_off")) {
    waveEnabled = false;
    digitalWrite(LED_BH,LOW);
    digitalWrite(LED_DHT,LOW);
    digitalWrite(LED_SYS,LOW);
    Serial.println("[CMD] Wave OFF");
    publishStatus("cmd_wave_off");

  } else if (strstr(msg, "on")) {
    sensorsEnabled = true;
    Serial.println("[CMD] Sensors ON — queued");
    pendingCmd = CMD_ON;
    lastCmdRetryTime = 0;

  } else if (strstr(msg, "off")) {
    sensorsEnabled = false;
    Serial.println("[CMD] Sensors OFF — queued");
    pendingCmd = CMD_OFF;
    lastCmdRetryTime = 0;

  } else if (strstr(msg, "status")) {
    publishStatus("cmd_status");

  } else {
    Serial.printf("[CMD] Unknown: %s\n", msg);
    publishStatus("cmd_unknown");
  }
}

// --- HÀM CHẠY SÓNG LED ---
void updateWave() {
  if (!waveEnabled) return;

  unsigned long currentMillis = millis();
  if (currentMillis - lastWaveTime >= waveSpeed) {
    lastWaveTime = currentMillis;

    digitalWrite(LED_BH,  LOW);
    digitalWrite(LED_DHT, LOW);
    digitalWrite(LED_SYS, LOW);

    if (currentLedStep == 0) digitalWrite(LED_BH,  HIGH);
    else if (currentLedStep == 1) digitalWrite(LED_DHT, HIGH);
    else if (currentLedStep == 2) digitalWrite(LED_SYS, HIGH);

    currentLedStep++;
    if (currentLedStep > 3) currentLedStep = 0;
  }
}

// --- HÀM ĐỌC CẢM BIẾN ---
void updateSensors() {
  if (!sensorsEnabled) return;
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorTime >= sensorInterval) {
    lastSensorTime = currentMillis;

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    float lux = lightMeter.readLightLevel();

    bool dhtValid = !isnan(h) && !isnan(t);
    bool luxValid = lux >= 0;

    if (!dhtValid || !luxValid) {
      Serial.println("[SENSOR] Waiting for valid data...");
      return;
    }

    Serial.printf("Real-time -> T: %.1f°C | H: %.1f%% | L: %.1f lx\n", t, h, lux);

    if (client.connected()) {
      char msg[100];
      snprintf(msg, 100, "{\"temp\":%.1f, \"hum\":%.1f, \"lux\":%.1f}", t, h, lux);
      client.publish(TOPIC_SENSORS, msg);
    }
  }
}

void reconnectWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost, reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
      delay(500);
      Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi reconnected");
    } else {
      Serial.println("\nWiFi reconnect failed");
    }
  }
}

void reconnect() {
  unsigned long currentMillis = millis();
  if (!client.connected() && currentMillis - lastReconnectAttempt >= reconnectInterval) {
    lastReconnectAttempt = currentMillis;
    Serial.println("Attempting MQTT reconnect...");
    if (client.connect("ESP32_Async_Client", "B22DCPT244", "123456")) {
      Serial.println("MQTT Connected");
      client.subscribe(TOPIC_CONTROL);
      publishStatus("connect");
    } else {
      Serial.printf("MQTT failed, rc=%d. Retry in %lus\n", client.state(), reconnectInterval / 1000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_DHT, OUTPUT);
  pinMode(LED_BH,  OUTPUT);
  pinMode(LED_SYS, OUTPUT);

  dht.begin();
  Wire.begin(21, 22);
  lightMeter.begin();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi connected");

  client.setServer(mqtt_server, 2004);
  client.setCallback(mqttCallback);
}

void processPendingCmd() {
  if (pendingCmd == CMD_NONE) return;
  unsigned long now = millis();
  if (now - lastCmdRetryTime < cmdRetryInterval) return;
  lastCmdRetryTime = now;

  const char* trigger = (pendingCmd == CMD_ON) ? "cmd_on" : "cmd_off";
  if (publishStatus(trigger)) {
    Serial.printf("[CMD] Confirmed: %s\n", trigger);
    pendingCmd = CMD_NONE;
  } else {
    Serial.printf("[CMD] Publish failed, retrying %s...\n", trigger);
  }
}

void loop() {
  reconnectWiFi();

  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  processPendingCmd();
  updateWave();
  updateSensors();
}
