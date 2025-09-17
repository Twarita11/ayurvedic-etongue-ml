from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import numpy as np
import joblib
import os
import logging
from datetime import datetime
from typing import List, Dict

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from .config import settings
from .models import SensorReading, PredictionResult, HistoricalData, TasteProfile

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="API for Ayurvedic medicine analysis using electronic tongue sensors"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=settings.cors_headers,
)

# Load models
try:
    logger.info("Loading models...")
    model_dir = settings.model_dir
    logger.debug(f"Model directory: {model_dir}")
    
    # Core models
    dilution_model = joblib.load(os.path.join(model_dir, "dilution_model.pkl"))
    medicine_model = joblib.load(os.path.join(model_dir, "medicine_model.pkl"))
    effectiveness_model = joblib.load(os.path.join(model_dir, "effectiveness_model.pkl"))
    logger.info("Core models loaded successfully")
    
    # Taste profile models
    taste_models = {}
    for taste in ["sweet", "sour", "salty", "bitter", "pungent", "astringent"]:
        model_path = os.path.join(model_dir, f"taste_{taste}_model.pkl")
        logger.debug(f"Loading model from {model_path}")
        taste_models[taste] = joblib.load(model_path)
    logger.info("Taste profile models loaded successfully")
    
except Exception as e:
    logger.error(f"Error loading models: {str(e)}", exc_info=True)
    dilution_model = None
    medicine_model = None
    effectiveness_model = None
    taste_models = {}

# In-memory storage for historical data
historical_data = []

@app.get("/")
async def root():
    """Root endpoint to check API status."""
    core_models_loaded = all([dilution_model, medicine_model, effectiveness_model])
    taste_models_loaded = all(model is not None for model in taste_models.values())
    return {
        "status": "online",
        "version": settings.version,
        "models_loaded": {
            "core_models": core_models_loaded,
            "taste_models": taste_models_loaded
        },
        "docs_url": "/docs"
    }

@app.post("/api/predict", response_model=PredictionResult)
async def predict(reading: SensorReading, background_tasks: BackgroundTasks):
    """
    Make predictions using sensor readings.
    
    Args:
        reading: Sensor reading data including temperature and spectral values
        
    Returns:
        Predictions for dilution percentage, medicine type, and effectiveness score
    """
    if not all([dilution_model, medicine_model, effectiveness_model]):
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    try:
        # Convert to numpy array
        X = np.array([[
            reading.as7263_r,
            reading.as7263_s,
            reading.as7263_t,
            reading.as7263_u,
            reading.as7263_v,
            reading.as7263_w,
            reading.temperature
        ]])
        
        # Make predictions
        dilution_pred = dilution_model.predict(X)[0]
        medicine_pred = medicine_model.predict(X)[0]
        effectiveness_pred = effectiveness_model.predict(X)[0]
        
        # Get confidence scores
        medicine_conf = np.max(medicine_model.predict_proba(X)[0])
        dilution_conf = 1 - np.std([tree.predict(X) for tree in dilution_model.estimators_], axis=0)[0]
        effectiveness_conf = 1 - np.std([tree.predict(X) for tree in effectiveness_model.estimators_], axis=0)[0]
        
        # Predict taste profiles
        taste_predictions = {}
        taste_confidences = {}
        
        for taste, model in taste_models.items():
            pred = model.predict(X)[0]
            conf = 1 - np.std([tree.predict(X) for tree in model.estimators_], axis=0)[0]
            taste_predictions[taste] = float(pred)
            taste_confidences[taste] = float(conf)
        
        # Create prediction result
        result = PredictionResult(
            dilution=float(dilution_pred),
            medicine=medicine_pred,
            effectiveness=float(effectiveness_pred),
            taste_profile=TasteProfile(**taste_predictions),
            confidence={
                "dilution": float(dilution_conf),
                "medicine": float(medicine_conf),
                "effectiveness": float(effectiveness_conf),
                "taste_profile": float(np.mean(list(taste_confidences.values())))
            }
        )
        
        # Store result in background
        background_tasks.add_task(store_prediction, reading, result)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.get("/api/history", response_model=HistoricalData)
async def get_history():
    """
    Get historical sensor readings and predictions.
    
    Returns:
        List of past sensor readings and their predictions
    """
    if not historical_data:
        return HistoricalData(readings=[], predictions=[], summary={})
        
    readings, predictions = zip(*historical_data)
    
    # Calculate summary statistics
    summary = {
        "dilution": {
            "mean": np.mean([p.dilution for p in predictions]),
            "std": np.std([p.dilution for p in predictions]),
        },
        "effectiveness": {
            "mean": np.mean([p.effectiveness for p in predictions]),
            "std": np.std([p.effectiveness for p in predictions]),
        },
        "taste_profile": {
            taste: {
                "mean": np.mean([getattr(p.taste_profile, taste) for p in predictions]),
                "std": np.std([getattr(p.taste_profile, taste) for p in predictions])
            }
            for taste in ["sweet", "sour", "salty", "bitter", "pungent", "astringent"]
        }
    }
    
    return HistoricalData(
        readings=list(readings),
        predictions=list(predictions),
        summary=summary
    )

def store_prediction(reading: SensorReading, prediction: PredictionResult):
    """Store the prediction result for historical analysis."""
    if len(historical_data) >= 1000:  # Keep last 1000 readings
        historical_data.pop(0)
    historical_data.append((reading, prediction))