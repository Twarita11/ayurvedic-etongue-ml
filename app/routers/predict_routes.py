from fastapi import APIRouter, HTTPException
from ..schemas import SensorData, PredictionResult
from ..database import db
from ..utils.predictor import ModelPredictor

router = APIRouter()

@router.post("/predict/{factory}/{medicine}", response_model=PredictionResult)
async def predict(
    factory: str,
    medicine: str,
    data: SensorData
):
    """Generate predictions for sensor readings."""
    try:
        # Load models
        predictor = ModelPredictor()
        
        # Load each model type
        for model_type in ["taste", "quality", "dilution"]:
            model_data = await db.load_model(factory, medicine, model_type)
            if not model_data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Model {model_type} not found for {factory} - {medicine}"
                )
            predictor.load_model(model_type, model_data)
            
        # Generate predictions
        predictions = predictor.predict(data.dict())
        return PredictionResult(**predictions)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))