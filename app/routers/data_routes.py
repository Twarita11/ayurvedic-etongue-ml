from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..schemas import SensorData
from ..database import db

router = APIRouter()

@router.post("/data/{factory}/{medicine}")
async def store_sensor_readings(
    factory: str,
    medicine: str,
    data: SensorData
):
    """Store sensor readings in the database."""
    try:
        result = await db.store_sensor_data(factory, medicine, data.dict())
        return {"status": "success", "message": "Data stored successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data/{factory}/{medicine}/recent")
async def get_recent_readings(
    factory: str,
    medicine: str,
    limit: int = 100
):
    """Get recent sensor readings."""
    try:
        data = await db.get_recent_data(factory, medicine, limit)
        return {"status": "success", "data": data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))