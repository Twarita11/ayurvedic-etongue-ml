import requests
import json
from typing import Dict, Optional, List
from datetime import datetime

class EtongueClient:
    """Python client for the Ayurvedic E-tongue API."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        """Initialize the client.
        
        Args:
            base_url: The base URL of the API server
        """
        self.base_url = base_url.rstrip("/")
        
    def health_check(self) -> Dict:
        """Check API server status."""
        response = requests.get(f"{self.base_url}/")
        response.raise_for_status()
        return response.json()
        
    def predict(self, 
                temperature: float,
                as7263_r: float,
                as7263_s: float,
                as7263_t: float,
                as7263_u: float,
                as7263_v: float,
                as7263_w: float,
                timestamp: Optional[datetime] = None) -> Dict:
        """Get predictions from sensor readings.
        
        Args:
            temperature: Temperature reading
            as7263_r: R channel reading
            as7263_s: S channel reading
            as7263_t: T channel reading
            as7263_u: U channel reading
            as7263_v: V channel reading
            as7263_w: W channel reading
            timestamp: Optional timestamp of reading
            
        Returns:
            Dict containing predictions and confidence scores
        """
        data = {
            "temperature": temperature,
            "as7263_r": as7263_r,
            "as7263_s": as7263_s,
            "as7263_t": as7263_t,
            "as7263_u": as7263_u,
            "as7263_v": as7263_v,
            "as7263_w": as7263_w
        }
        
        if timestamp:
            data["timestamp"] = timestamp.isoformat()
            
        response = requests.post(f"{self.base_url}/api/predict", json=data)
        response.raise_for_status()
        return response.json()
        
    def get_history(self) -> Dict[str, List]:
        """Get historical readings and predictions."""
        response = requests.get(f"{self.base_url}/api/history")
        response.raise_for_status()
        return response.json()

if __name__ == "__main__":
    # Example usage
    client = EtongueClient()
    
    # Check server status
    status = client.health_check()
    print("Server status:", status)
    
    # Make a prediction
    prediction = client.predict(
        temperature=25.3,
        as7263_r=0.56,
        as7263_s=0.48,
        as7263_t=0.61,
        as7263_u=0.42,
        as7263_v=0.39,
        as7263_w=0.51
    )
    print("\nPrediction:", json.dumps(prediction, indent=2))
    
    # Get history
    history = client.get_history()
    print("\nHistory:", json.dumps(history, indent=2))