#include <Arduino.h>
#include <Wire.h>
#include <AS7263.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi settings
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";

// API settings
const char* apiEndpoint = "http://your-api-server:8000/api/predict";

// AS7263 sensor
AS7263 sensor;

void setup() {
    Serial.begin(115200);
    
    // Initialize sensor
    if (!sensor.begin()) {
        Serial.println("AS7263 not found!");
        while (1);
    }
    
    // Connect to WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nConnected to WiFi");
}

void loop() {
    // Read sensor data
    float temperature = sensor.getTemperature();
    float r = sensor.getR();
    float s = sensor.getS();
    float t = sensor.getT();
    float u = sensor.getU();
    float v = sensor.getV();
    float w = sensor.getW();
    
    // Create JSON document
    StaticJsonDocument<200> doc;
    doc["temperature"] = temperature;
    doc["as7263_r"] = r;
    doc["as7263_s"] = s;
    doc["as7263_t"] = t;
    doc["as7263_u"] = u;
    doc["as7263_v"] = v;
    doc["as7263_w"] = w;
    
    // Serialize JSON
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send data to API
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(apiEndpoint);
        http.addHeader("Content-Type", "application/json");
        
        int httpResponseCode = http.POST(jsonString);
        
        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println("Response:");
            Serial.println(response);
            
            // Parse prediction response
            StaticJsonDocument<512> respDoc;
            deserializeJson(respDoc, response);
            
            // Extract predictions
            float dilution = respDoc["dilution"];
            const char* medicine = respDoc["medicine"];
            float effectiveness = respDoc["effectiveness"];
            
            // Print results
            Serial.println("\nPredictions:");
            Serial.print("Dilution: "); Serial.println(dilution);
            Serial.print("Medicine: "); Serial.println(medicine);
            Serial.print("Effectiveness: "); Serial.println(effectiveness);
        } else {
            Serial.print("Error code: ");
            Serial.println(httpResponseCode);
        }
        
        http.end();
    }
    
    // Wait before next reading
    delay(5000);
}