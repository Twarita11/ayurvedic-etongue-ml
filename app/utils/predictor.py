import numpy as np
from sklearn.svm import SVR
from sklearn.multioutput import MultiOutputRegressor
import joblib
import io

class ModelPredictor:
    def __init__(self):
        """Initialize predictor."""
        self.models = {}
        
    def load_model(self, model_type: str, model_data: bytes):
        """Load model from bytes."""
        buffer = io.BytesIO(model_data)
        self.models[model_type] = joblib.load(buffer)
        
    def prepare_features(self, data: dict) -> np.ndarray:
        """Prepare feature vector from sensor data."""
        return np.array([[
            data["temperature"],
            data["mq3_ppm"],
            data["as7263_r"],
            data["as7263_s"],
            data["as7263_t"],
            data["as7263_u"],
            data["as7263_v"],
            data["as7263_w"]
        ]])
        
    def predict(self, data: dict) -> dict:
        """Generate predictions using all models."""
        # Prepare features
        X = self.prepare_features(data)
        
        # Generate predictions
        taste_pred = self.models["taste"].predict(X)[0]
        quality_pred = self.models["quality"].predict(X)[0]
        dilution_pred = self.models["dilution"].predict(X)[0]
        
        return {
            "taste_sweet": float(taste_pred[0]),
            "taste_salty": float(taste_pred[1]),
            "taste_bitter": float(taste_pred[2]),
            "taste_sour": float(taste_pred[3]),
            "taste_umami": float(taste_pred[4]),
            "quality": float(quality_pred),
            "dilution": float(dilution_pred)
        }