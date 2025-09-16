from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SensorData(BaseModel):
    """Schema for sensor readings."""
    timestamp: datetime
    temperature: float
    mq3_ppm: float
    as7263_r: float
    as7263_s: float
    as7263_t: float
    as7263_u: float
    as7263_v: float
    as7263_w: float
    
    class Config:
        schema_extra = {
            "example": {
                "timestamp": "2023-09-16T12:00:00Z",
                "temperature": 25.3,
                "mq3_ppm": 120,
                "as7263_r": 0.56,
                "as7263_s": 0.48,
                "as7263_t": 0.61,
                "as7263_u": 0.42,
                "as7263_v": 0.39,
                "as7263_w": 0.51
            }
        }

class PredictionResult(BaseModel):
    """Schema for prediction results."""
    taste_sweet: float
    taste_salty: float
    taste_bitter: float
    taste_sour: float
    taste_umami: float
    quality: float
    dilution: float
    
    class Config:
        schema_extra = {
            "example": {
                "taste_sweet": 0.75,
                "taste_salty": 0.25,
                "taste_bitter": 0.15,
                "taste_sour": 0.35,
                "taste_umami": 0.45,
                "quality": 0.85,
                "dilution": 0.50
            }
        }

class TrainingResponse(BaseModel):
    """Schema for training response."""
    status: str
    message: str
    model_versions: dict
    training_metrics: Optional[dict]