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

// --- Thông số cấu hình ---
const char* ssid = "phong 501";
const char* password = "23456789";
const char* mqtt_server = "192.168.5.102";

// --- Biến quản lý thời gian (Non-blocking) ---
unsigned long lastSensorTime = 0;
const long sensorInterval = 2000; // Đọc cảm biến mỗi 2 giây

unsigned long lastWaveTime = 0;
unsigned long lastReconnectAttempt = 0;
const long reconnectInterval = 5000; // Thử kết nối lại mỗi 5 giây
const long waveSpeed = 150;      // Tốc độ chạy sóng (ms)
int currentLedStep = 0;          // Bước hiện tại của sóng LED

// Khởi tạo đối tượng
DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;
WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  pinMode(LED_DHT, OUTPUT);
  pinMode(LED_BH, OUTPUT);
  pinMode(LED_SYS, OUTPUT);

  dht.begin();
  Wire.begin(21, 22);
  lightMeter.begin();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi connected");
  
  client.setServer(mqtt_server, 2004);
}

// --- HÀM CHẠY SÓNG LED RIÊNG BIỆT ---
void updateWave() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastWaveTime >= waveSpeed) {
    lastWaveTime = currentMillis;
    
    // Tắt tất cả các LED trước khi sang bước mới
    digitalWrite(LED_BH, LOW);
    digitalWrite(LED_DHT,LOW);
    digitalWrite(LED_SYS, LOW);
    
    // Bật LED theo bước (Sóng chạy từ trái qua phải)
    if (currentLedStep == 0) digitalWrite(LED_BH, HIGH);
    else if (currentLedStep == 1) digitalWrite(LED_DHT,HIGH);
    else if (currentLedStep == 2) digitalWrite(LED_SYS, HIGH);
    
    currentLedStep++;
    if (currentLedStep > 3) currentLedStep = 0; // Reset vòng lặp sóng (bước 3 là tắt hết)
  }
}

// --- HÀM ĐỌC CẢM BIẾN RIÊNG BIỆT ---
void updateSensors() {
  unsigned long currentMillis = millis();
  
  if (currentMillis - lastSensorTime >= sensorInterval) {
    lastSensorTime = currentMillis;

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    float lux = lightMeter.readLightLevel();

    Serial.print("Real-time -> ");
    if (!isnan(h) && !isnan(t)) {
      Serial.printf("T: %.1f°C | H: %.1f%% | ", t, h);
    }
    if (lux >= 0) {
      Serial.printf("L: %.1f lx\n", lux);
    }

    // Gửi MQTT
    if (client.connected()) {
      char msg[100];
      snprintf(msg, 100, "{\"temp\":%.1f, \"hum\":%.1f, \"lux\":%.1f}", t, h, lux);
      client.publish("esp32/sensors", msg);
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
    } else {
      Serial.printf("MQTT failed, rc=%d. Retry in %lus\n", client.state(), reconnectInterval / 1000);
    }
  }
}

void loop() {
  reconnectWiFi();

  // MQTT duy trì kết nối
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Hai tác vụ chạy hoàn toàn độc lập
  updateWave();    // Chạy sóng LED liên tục mượt mà
  updateSensors(); // Đọc cảm biến định kỳ không gây lag đèn
}