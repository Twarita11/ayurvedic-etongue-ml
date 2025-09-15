"""FastAPI endpoints for Ayurvedic medicine sensor analysis."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
import json
from typing import List, Dict, Optional
import numpy as np
import os
from src.data.preprocessing import DataPreprocessor
from src.features.engineering import FeatureEngineer
from src.models.ensemble import EnsembleModel

app = FastAPI(
    title="Ayurvedic Medicine Sensor Analysis API",
    description="API for analyzing NIR sensor data from Ayurvedic medicines",
    version="1.0.0"
)

# Initialize components
preprocessor = DataPreprocessor()
feature_engineer = FeatureEngineer()
model = EnsembleModel(model_path="models")

class SensorReading(BaseModel):
    """Request model for sensor readings."""
    R: float
    S: float
    T: float
    U: float
    V: float
    W: float
    Temperature: float
    
    @validator('*')
    def validate_readings(cls, v):
        """Validate that all readings are non-negative."""
        if v < 0:
            raise ValueError("Sensor readings must be non-negative")
        return v

class PredictionResponse(BaseModel):
    """Response model for predictions."""
    dilution_percent: float
    dilution_confidence: float
    medicine_type: str
    medicine_confidence: float
    effectiveness_score: float
    effectiveness_confidence: float

@app.post("/predict", response_model=PredictionResponse)
async def predict(reading: SensorReading):
    """Generate predictions for a single sensor reading."""
    try:
        # Prepare input data
        X = np.array([[
            reading.R, reading.S, reading.T, reading.U,
            reading.V, reading.W, reading.Temperature
        ]])
        
        # Preprocess data
        X_norm = preprocessor.normalize_features(
            preprocessor.temperature_compensation(X)
        )
        
        # Engineer features
        features = feature_engineer.engineer_features(
            X_norm[:, :-1],  # sensor readings
            X_norm[:, -1],   # temperature
            fit=False
        )
        
        # Generate predictions
        predictions = model.predict(features['combined'])
        
        return PredictionResponse(
            dilution_percent=float(predictions['dilution']['predictions'][0]),
            dilution_confidence=float(predictions['dilution']['confidence'][0]),
            medicine_type=str(predictions['medicine']['predictions'][0]),
            medicine_confidence=float(predictions['medicine']['confidence'][0]),
            effectiveness_score=float(predictions['effectiveness']['predictions'][0]),
            effectiveness_confidence=float(predictions['effectiveness']['confidence'][0])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}"
        )

class BatchSensorReadings(BaseModel):
    """Request model for batch predictions."""
    readings: List[SensorReading]

@app.post("/predict/batch", response_model=List[PredictionResponse])
async def predict_batch(readings: BatchSensorReadings):
    """Generate predictions for multiple sensor readings."""
    try:
        # Prepare input data
        X = np.array([
            [r.R, r.S, r.T, r.U, r.V, r.W, r.Temperature]
            for r in readings.readings
        ])
        
        # Preprocess data
        X_norm = preprocessor.normalize_features(
            preprocessor.temperature_compensation(X)
        )
        
        # Engineer features
        features = feature_engineer.engineer_features(
            X_norm[:, :-1],
            X_norm[:, -1],
            fit=False
        )
        
        # Generate predictions
        predictions = model.predict(features['combined'])
        
        return [
            PredictionResponse(
                dilution_percent=float(predictions['dilution']['predictions'][i]),
                dilution_confidence=float(predictions['dilution']['confidence'][i]),
                medicine_type=str(predictions['medicine']['predictions'][i]),
                medicine_confidence=float(predictions['medicine']['confidence'][i]),
                effectiveness_score=float(predictions['effectiveness']['predictions'][i]),
                effectiveness_confidence=float(predictions['effectiveness']['confidence'][i])
            )
            for i in range(len(readings.readings))
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Batch prediction error: {str(e)}"
        )

class ModelInfo(BaseModel):
    """Response model for model information."""
    model_version: str
    supported_medicines: List[str]
    feature_names: List[str]
    last_trained: Optional[str]

@app.get("/info", response_model=ModelInfo)
async def get_model_info():
    """Get information about the current model."""
    try:
        # Load class names from saved model
        with open("models/class_names.json", 'r') as f:
            class_info = json.load(f)
            
        return ModelInfo(
            model_version="1.0.0",
            supported_medicines=class_info['medicine_types'],
            feature_names=preprocessor.sensor_columns + [preprocessor.temp_column],
            last_trained=None  # Add this when implementing model retraining
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving model info: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Check if the service is healthy."""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)