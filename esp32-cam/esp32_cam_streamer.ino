/*
  ====================================================================
  Smart Railway Detection System — ESP32-CAM Video Streamer Sketch
  ====================================================================
  This firmware turns an ESP32-CAM (AI-Thinker module) into a Wi-Fi
  MJPEG video stream server on port 81 and snapshot server on port 80.
  
  Requirements:
  - Board: ESP32 Wrover Module (or ESP32 Dev Module / ESP32 Cam)
  - PSRAM: Enabled (Required for high resolutions)
  - Arduino IDE with ESP32 board manager installed
  ====================================================================
*/

#include "esp_camera.h"
#include <WiFi.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ─── WI-FI SETTINGS ───────────────────────────────────────────────
const char* ssid = "YOUR_WIFI_SSID";         // Replace with your SSID
const char* password = "YOUR_WIFI_PASSWORD"; // Replace with your password

// ─── CAMERA MODULE PINOUT (AI-THINKER) ───────────────────────────
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define FLASH_GPIO_NUM     4   // Built-in high-power flash LED
#define RED_LED_GPIO_NUM  33   // Built-in status red LED (Active Low)

// ─── WEB SERVER PORT ──────────────────────────────────────────────
WiFiServer streamServer(81);
WiFiServer captureServer(80);

void startCameraServer();

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); // Disable brownout detector
  
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();
  
  pinMode(FLASH_GPIO_NUM, OUTPUT);
  pinMode(RED_LED_GPIO_NUM, OUTPUT);
  digitalWrite(FLASH_GPIO_NUM, LOW);       // Turn off flash
  digitalWrite(RED_LED_GPIO_NUM, HIGH);    // Turn off active-low status LED

  // Camera configuration
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Frame settings (moderate resolution for fast YOLO inference)
  if (psramFound()) {
    config.frame_size = FRAMESIZE_VGA;  // 640x480 (Recommended)
    config.jpeg_quality = 12;           // 0-63, lower means higher quality
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_CIF;  // 400x296
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    // Blink error LED
    while(true) {
      digitalWrite(RED_LED_GPIO_NUM, LOW);
      delay(100);
      digitalWrite(RED_LED_GPIO_NUM, HIGH);
      delay(100);
    }
  }

  sensor_t * s = esp_camera_sensor_get();
  // Drop down frame rate if needed (vertical flip / mirror depending on mounting)
  s->set_vflip(s, 0); // 1 to enable vertical flip
  s->set_hmirror(s, 0); // 1 to enable horizontal mirror

  // Connect to Wi-Fi
  Serial.printf("Connecting to Wi-Fi: %s\n", ssid);
  WiFi.begin(ssid, password);
  
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    // Blink status LED slowly during connection
    digitalWrite(RED_LED_GPIO_NUM, wifiAttempts % 2);
    wifiAttempts++;
  }
  digitalWrite(RED_LED_GPIO_NUM, HIGH); // Turn off status LED (High = Off)
  
  Serial.println("");
  Serial.println("✅ Wi-Fi connected");
  Serial.print("Stream Link: http://");
  Serial.print(WiFi.localIP());
  Serial.println(":81/stream");
  Serial.print("Snapshot Link: http://");
  Serial.print(WiFi.localIP());
  Serial.println("/capture");

  // Start servers
  streamServer.begin();
  captureServer.begin();
}

// Handler for MJPEG Video Stream (Port 81)
void handleStream(WiFiClient client) {
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: multipart/x-mixed-replace; boundary=frame");
  client.println();

  while (client.connected()) {
    camera_fb_t * fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      break;
    }

    client.printf("--frame\r\nContent-Type: image/jpeg\r\nContent-Length: %d\r\n\r\n", fb->len);
    
    // Write frame chunks to avoid memory congestion
    uint8_t *out_buf = fb->buf;
    size_t out_len = fb->len;
    size_t chunk_size = 1024;
    while (out_len > 0) {
      size_t will_write = out_len < chunk_size ? out_len : chunk_size;
      client.write(out_buf, will_write);
      out_buf += will_write;
      out_len -= will_write;
    }
    
    client.print("\r\n");
    esp_camera_fb_return(fb);
    
    // Tiny delay to regulate frames (around 15-20 FPS)
    delay(30);
  }
  client.stop();
}

// Handler for Single Snapshot Capture (Port 80)
void handleCapture(WiFiClient client) {
  // Read request
  String req = client.readStringUntil('\r');
  client.flush();

  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    client.println("HTTP/1.1 500 Internal Server Error");
    client.println("Content-Type: text/plain");
    client.println();
    client.println("Camera capture failed");
    client.stop();
    return;
  }

  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: image/jpeg");
  client.printf("Content-Length: %d\r\n", fb->len);
  client.println("Connection: close\r\n");
  
  uint8_t *out_buf = fb->buf;
  size_t out_len = fb->len;
  size_t chunk_size = 1024;
  while (out_len > 0) {
    size_t will_write = out_len < chunk_size ? out_len : chunk_size;
    client.write(out_buf, will_write);
    out_buf += will_write;
    out_len -= will_write;
  }
  
  esp_camera_fb_return(fb);
  client.stop();
}

void loop() {
  // Check Wi-Fi reconnection status
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Connection lost. Reconnecting to Wi-Fi...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      digitalWrite(RED_LED_GPIO_NUM, attempts % 2);
      attempts++;
    }
    digitalWrite(RED_LED_GPIO_NUM, HIGH);
  }

  // Handle client requests on port 81 (Stream)
  WiFiClient streamClient = streamServer.available();
  if (streamClient) {
    handleStream(streamClient);
  }

  // Handle client requests on port 80 (Capture)
  WiFiClient captureClient = captureServer.available();
  if (captureClient) {
    handleCapture(captureClient);
  }
}
