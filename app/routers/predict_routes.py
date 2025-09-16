from fastapi import APIRouter, HTTPException
from ..schemas import SensorData, PredictionResult
import joblib
import os
import numpy as np

router = APIRouter()

# Load models
try:
    model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")
    dilution_model = joblib.load(os.path.join(model_dir, "dilution_model.pkl"))
    medicine_model = joblib.load(os.path.join(model_dir, "medicine_model.pkl"))
    effectiveness_model = joblib.load(os.path.join(model_dir, "effectiveness_model.pkl"))
except Exception as e:
    print(f"Error loading models: {str(e)}")
    dilution_model = None
    medicine_model = None
    effectiveness_model = None

@router.post("/predict")
async def predict(data: SensorData):
    """Generate predictions for sensor readings."""
    if not all([dilution_model, medicine_model, effectiveness_model]):
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    try:
        # Convert to numpy array
        X = np.array([[
            data.as7263_r,
            data.as7263_s,
            data.as7263_t,
            data.as7263_u,
            data.as7263_v,
            data.as7263_w,
            data.temperature
        ]])
        
        # Make predictions
        dilution_pred = dilution_model.predict(X)[0]
        medicine_pred = medicine_model.predict(X)[0]
        effectiveness_pred = effectiveness_model.predict(X)[0]
        
        # Get confidence scores
        medicine_conf = np.max(medicine_model.predict_proba(X)[0])
        dilution_conf = 1 - np.std([tree.predict(X) for tree in dilution_model.estimators_], axis=0)[0]
        effectiveness_conf = 1 - np.std([tree.predict(X) for tree in effectiveness_model.estimators_], axis=0)[0]
        
        return {
            "dilution": float(dilution_pred),
            "medicine": medicine_pred,
            "effectiveness": float(effectiveness_pred),
            "confidence": {
                "dilution": float(dilution_conf),
                "medicine": float(medicine_conf),
                "effectiveness": float(effectiveness_conf)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")