import requests
import json
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Test data
test_data = {
    "timestamp": "2025-09-17T12:00:00Z",
    "temperature": 25.3,
    "as7263_r": 0.56,
    "as7263_s": 0.48,
    "as7263_t": 0.61,
    "as7263_u": 0.42,
    "as7263_v": 0.39,
    "as7263_w": 0.51
}

def test_api():
    try:
        # Check API status
        print("\nTrying to connect to API...")
        response = requests.get("http://127.0.0.1:8080/")
        status = response.json()
        print("\nAPI Status:")
        print(json.dumps(status, indent=2))
        
        # Make a prediction
        print("\nMaking prediction...")
        response = requests.post("http://127.0.0.1:8080/api/predict", json=test_data)
        prediction = response.json()
        print("\nPrediction Result:")
        print(json.dumps(prediction, indent=2))
        
        # Get history
        print("\nGetting history...")
        response = requests.get("http://127.0.0.1:8080/api/history")
        history = response.json()
        print("\nHistory Summary:")
        print(json.dumps(history["summary"], indent=2))
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        print("\nPython version:", sys.version)
        print("\nRequests version:", requests.__version__)

if __name__ == "__main__":
    test_api()