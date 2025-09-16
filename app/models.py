from pydantic import BaseModel
from typing import Dict, Optional, List
from datetime import datetime

class SensorReading(BaseModel):
    timestamp: Optional[datetime] = None
    temperature: float
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
                "as7263_r": 0.56,
                "as7263_s": 0.48,
                "as7263_t": 0.61,
                "as7263_u": 0.42,
                "as7263_v": 0.39,
                "as7263_w": 0.51
            }
        }

class PredictionResult(BaseModel):
    dilution: float
    medicine: str
    effectiveness: float
    confidence: Dict[str, float]
    
    class Config:
        schema_extra = {
            "example": {
                "dilution": 75.5,
                "medicine": "Tulsi",
                "effectiveness": 0.85,
                "confidence": {
                    "dilution": 0.92,
                    "medicine": 0.88,
                    "effectiveness": 0.90
                }
            }
        }

class HistoricalData(BaseModel):
    readings: List[SensorReading]
    predictions: List[PredictionResult]
    summary: Dict[str, Dict[str, float]]