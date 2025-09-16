import numpy as np
from sklearn.svm import SVR
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import io

class ModelTrainer:
    def __init__(self):
        """Initialize model trainer with preprocessing."""
        self.feature_scaler = StandardScaler()
        self.target_scalers = {
            "taste": StandardScaler(),
            "quality": StandardScaler(),
            "dilution": StandardScaler()
        }
        self.metrics = {}
        
    def prepare_features(self, data: list) -> np.ndarray:
        """Prepare feature matrix from sensor data."""
        features = []
        for record in data:
            features.append([
                record["temperature"],
                record["mq3_ppm"],
                record["as7263_r"],
                record["as7263_s"],
                record["as7263_t"],
                record["as7263_u"],
                record["as7263_v"],
                record["as7263_w"]
            ])
        return np.array(features)
        
    def prepare_targets(self, data: list) -> tuple:
        """Prepare target variables."""
        taste_targets = []
        quality_targets = []
        dilution_targets = []
        
        for record in data:
            taste_targets.append([
                record["taste_sweet"],
                record["taste_salty"],
                record["taste_bitter"],
                record["taste_sour"],
                record["taste_umami"]
            ])
            quality_targets.append(record["quality"])
            dilution_targets.append(record["dilution"])
            
        return (
            np.array(taste_targets),
            np.array(quality_targets),
            np.array(dilution_targets)
        )
        
    def train_all_models(self, data: list) -> tuple:
        """Train all three models."""
        # Prepare data
        X = self.prepare_features(data)
        y_taste, y_quality, y_dilution = self.prepare_targets(data)
        
        # Scale features
        X_scaled = self.feature_scaler.fit_transform(X)
        
        # Train taste model (multi-output)
        taste_model = MultiOutputRegressor(SVR(kernel='rbf'))
        taste_model.fit(X_scaled, y_taste)
        
        # Train quality model
        quality_model = SVR(kernel='rbf')
        quality_model.fit(X_scaled, y_quality)
        
        # Train dilution model
        dilution_model = SVR(kernel='rbf')
        dilution_model.fit(X_scaled, y_dilution)
        
        # Save models to bytes
        taste_bytes = self._model_to_bytes(taste_model)
        quality_bytes = self._model_to_bytes(quality_model)
        dilution_bytes = self._model_to_bytes(dilution_model)
        
        return taste_bytes, quality_bytes, dilution_bytes
        
    def _model_to_bytes(self, model) -> bytes:
        """Convert model to bytes for storage."""
        buffer = io.BytesIO()
        joblib.dump(model, buffer)
        return buffer.getvalue()
        
    def get_metrics(self) -> dict:
        """Return training metrics."""
        return self.metrics