from fastapi import APIRouter, HTTPException, BackgroundTasks
from ..schemas import TrainingResponse
from ..database import db
from ..utils.trainer import ModelTrainer
from ..utils.notifier import send_telegram_notification

router = APIRouter()

@router.post("/train/{factory}/{medicine}", response_model=TrainingResponse)
async def train_models(
    factory: str,
    medicine: str,
    background_tasks: BackgroundTasks
):
    """Train models for specific factory and medicine."""
    try:
        # Get training data
        data = await db.get_training_data(factory, medicine)
        
        if not data or len(data) < 100:
            raise HTTPException(
                status_code=400,
                detail="Insufficient training data. Need at least 100 samples."
            )
            
        # Initialize trainer
        trainer = ModelTrainer()
        
        # Train models
        taste_model, quality_model, dilution_model = trainer.train_all_models(data)
        
        # Store models
        for model_type, model in [
            ("taste", taste_model),
            ("quality", quality_model),
            ("dilution", dilution_model)
        ]:
            await db.store_model(factory, medicine, model_type, model)
            
        # Send notification in background
        background_tasks.add_task(
            send_telegram_notification,
            f"Training completed for {factory} - {medicine}"
        )
        
        return TrainingResponse(
            status="success",
            message="Models trained and stored successfully",
            model_versions={
                "taste": "1.0.0",
                "quality": "1.0.0",
                "dilution": "1.0.0"
            },
            training_metrics=trainer.get_metrics()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))