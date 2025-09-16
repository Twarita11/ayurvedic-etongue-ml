def generate_python_client(factory: str, medicine: str, api_url: str) -> str:
    """Generate Python client code."""
    return f'''
import requests
import time
from typing import Dict, Any

class EtongueClient:
    def __init__(self):
        """Initialize client."""
        self.api_url = "{api_url}"
        self.factory = "{factory}"
        self.medicine = "{medicine}"
        
    def send_reading(self, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send sensor reading to API."""
        endpoint = f"{{self.api_url}}/data/{{self.factory}}/{{self.medicine}}"
        response = requests.post(endpoint, json=sensor_data)
        return response.json()
        
    def get_prediction(self, sensor_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get predictions for sensor reading."""
        endpoint = f"{{self.api_url}}/predict/{{self.factory}}/{{self.medicine}}"
        response = requests.post(endpoint, json=sensor_data)
        return response.json()
        
# Usage example:
if __name__ == "__main__":
    client = EtongueClient()
    
    # Example sensor reading
    data = {{
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "temperature": 25.3,
        "mq3_ppm": 120,
        "as7263_r": 0.56,
        "as7263_s": 0.48,
        "as7263_t": 0.61,
        "as7263_u": 0.42,
        "as7263_v": 0.39,
        "as7263_w": 0.51
    }}
    
    # Send reading
    result = client.send_reading(data)
    print("Reading sent:", result)
    
    # Get prediction
    prediction = client.get_prediction(data)
    print("Prediction:", prediction)
'''

def generate_arduino_client(factory: str, medicine: str, api_url: str) -> str:
    """Generate Arduino client code."""
    return f'''
#include <AS726X.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Network credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API endpoints
const char* API_URL = "{api_url}";
const char* FACTORY = "{factory}";
const char* MEDICINE = "{medicine}";

// Sensor objects
AS726X sensor;
HTTPClient http;

void setup() {{
    Serial.begin(115200);
    
    // Initialize AS7263 sensor
    Wire.begin();
    sensor.begin();
    
    // Connect to WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {{
        delay(500);
        Serial.print(".");
    }}
    Serial.println("WiFi connected");
}}

void loop() {{
    // Read sensors
    sensor.takeMeasurements();
    float temperature = sensor.getTemperature();
    
    // Create JSON document
    StaticJsonDocument<200> doc;
    doc["timestamp"] = ""; // Add current timestamp
    doc["temperature"] = temperature;
    doc["mq3_ppm"] = analogRead(A0); // MQ3 sensor on A0
    doc["as7263_r"] = sensor.getR();
    doc["as7263_s"] = sensor.getS();
    doc["as7263_t"] = sensor.getT();
    doc["as7263_u"] = sensor.getU();
    doc["as7263_v"] = sensor.getV();
    doc["as7263_w"] = sensor.getW();
    
    // Send data to API
    String endpoint = String(API_URL) + "/data/" + FACTORY + "/" + MEDICINE;
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpCode = http.POST(jsonString);
    if (httpCode > 0) {{
        String response = http.getString();
        Serial.println(response);
    }}
    
    http.end();
    delay(5000); // Wait 5 seconds before next reading
}}
'''

def generate_client_code(factory: str, medicine: str, api_url: str, client_type: str) -> str:
    """Generate client code based on type."""
    if client_type.lower() == "python":
        return generate_python_client(factory, medicine, api_url)
    elif client_type.lower() == "arduino":
        return generate_arduino_client(factory, medicine, api_url)
    else:
        raise ValueError(f"Unsupported client type: {client_type}")