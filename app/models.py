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

class TasteProfile(BaseModel):
    sweet: float
    sour: float
    salty: float
    bitter: float
    pungent: float
    astringent: float
    
    class Config:
        schema_extra = {
            "example": {
                "sweet": 0.7,
                "sour": 0.2,
                "salty": 0.1,
                "bitter": 0.4,
                "pungent": 0.3,
                "astringent": 0.6
            }
        }

class PredictionResult(BaseModel):
    dilution: float
    medicine: str
    effectiveness: float
    taste_profile: TasteProfile
    confidence: Dict[str, float]
    
    class Config:
        schema_extra = {
            "example": {
                "dilution": 75.5,
                "medicine": "Tulsi",
                "effectiveness": 0.85,
                "taste_profile": {
                    "sweet": 0.7,
                    "sour": 0.2,
                    "salty": 0.1,
                    "bitter": 0.4,
                    "pungent": 0.3,
                    "astringent": 0.6
                },
                "confidence": {
                    "dilution": 0.92,
                    "medicine": 0.88,
                    "effectiveness": 0.90,
                    "taste_profile": 0.87
                }
            }
        }

class HistoricalData(BaseModel):
    readings: List[SensorReading]
    predictions: List[PredictionResult]
    summary: Dict[str, Dict[str, float]]
    
    class Config:
        schema_extra = {
            "example": {
                "readings": [],
                "predictions": [],
                "summary": {
                    "dilution": {
                        "mean": 75.5,
                        "std": 12.3
                    },
                    "effectiveness": {
                        "mean": 0.85,
                        "std": 0.12
                    },
                    "taste_profile": {
                        "sweet": {"mean": 0.7, "std": 0.1},
                        "sour": {"mean": 0.2, "std": 0.05},
                        "salty": {"mean": 0.1, "std": 0.03},
                        "bitter": {"mean": 0.4, "std": 0.08},
                        "pungent": {"mean": 0.3, "std": 0.07},
                        "astringent": {"mean": 0.6, "std": 0.09}
                    }
                }
            }
        }