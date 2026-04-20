#ifndef CONFIG_H
#define CONFIG_H

// --- Hardware Pins ---
constexpr int LED_TEMP_PIN = 27;
constexpr int LED_BH_PIN = 26;
constexpr int LED_HUMI_PIN = 5;
constexpr int LED1_PIN = 18;
constexpr int LED2_PIN = 19;
constexpr int DHTPIN = 4;
constexpr int DHTTYPE = 11;

// --- WiFi Credentials ---
const char *ssid = "iPhone";
const char *password = "88888888";

// --- MQTT Server ---
const char *mqtt_server = "172.20.10.2";
const int mqtt_port = 2004; // User requested port 2004

// --- MQTT Credentials ---
const char *mqtt_user = "B22DCPT244";
const char *mqtt_pass = "123456";

#endif // CONFIG_H
