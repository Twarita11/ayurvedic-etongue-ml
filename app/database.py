from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from typing import Optional, Dict, List
from datetime import datetime
from .config import settings
from .models import SensorData, PredictionResult

SQLALCHEMY_DATABASE_URL = settings.database_url

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    temperature = Column(Float)
    as7263_r = Column(Float)
    as7263_s = Column(Float)
    as7263_t = Column(Float)
    as7263_u = Column(Float)
    as7263_v = Column(Float)
    as7263_w = Column(Float)

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    sensor_reading_id = Column(Integer, ForeignKey("sensor_readings.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    dilution = Column(Float)
    medicine = Column(String)
    effectiveness = Column(Float)
    confidence = Column(JSON)

class StoredModel(Base):
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    version = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    model_type = Column(String)  # dilution, medicine, effectiveness
    file_path = Column(String)
    metrics = Column(JSON)

# Create all tables
Base.metadata.create_all(bind=engine)

class Database:
    def __init__(self):
        """Initialize database connection."""
        self.SessionLocal = SessionLocal
        
    def get_db(self) -> Session:
        """Get database session."""
        db = self.SessionLocal()
        try:
            return db
        except Exception as e:
            db.close()
            raise e
            
    async def store_sensor_data(self, reading: SensorData) -> SensorReading:
        """Store sensor readings in the database."""
        db = self.get_db()
        try:
            db_reading = SensorReading(
                timestamp=reading.timestamp or datetime.utcnow(),
                temperature=reading.temperature,
                as7263_r=reading.as7263_r,
                as7263_s=reading.as7263_s,
                as7263_t=reading.as7263_t,
                as7263_u=reading.as7263_u,
                as7263_v=reading.as7263_v,
                as7263_w=reading.as7263_w
            )
            db.add(db_reading)
            db.commit()
            db.refresh(db_reading)
            return db_reading
        finally:
            db.close()
            
    async def store_prediction(self, reading_id: int, prediction: PredictionResult) -> Prediction:
        """Store prediction results in the database."""
        db = self.get_db()
        try:
            db_prediction = Prediction(
                sensor_reading_id=reading_id,
                dilution=prediction.dilution,
                medicine=prediction.medicine,
                effectiveness=prediction.effectiveness,
                confidence=prediction.confidence
            )
            db.add(db_prediction)
            db.commit()
            db.refresh(db_prediction)
            return db_prediction
        finally:
            db.close()
            
    async def store_model(self, name: str, version: str, model_type: str, file_path: str, metrics: Dict) -> StoredModel:
        """Store model metadata in the database."""
        db = self.get_db()
        try:
            db_model = StoredModel(
                name=name,
                version=version,
                model_type=model_type,
                file_path=file_path,
                metrics=metrics
            )
            db.add(db_model)
            db.commit()
            db.refresh(db_model)
            return db_model
        finally:
            db.close()
            
    async def get_recent_readings(self, limit: int = 100) -> List[SensorReading]:
        """Get recent sensor readings."""
        db = self.get_db()
        try:
            return db.query(SensorReading)\
                .order_by(SensorReading.timestamp.desc())\
                .limit(limit)\
                .all()
        finally:
            db.close()
            
    async def get_predictions_for_reading(self, reading_id: int) -> Optional[Prediction]:
        """Get predictions for a specific sensor reading."""
        db = self.get_db()
        try:
            return db.query(Prediction)\
                .filter(Prediction.sensor_reading_id == reading_id)\
                .first()
        finally:
            db.close()
            
    async def get_latest_model(self, model_type: str) -> Optional[StoredModel]:
        """Get the latest version of a model type."""
        db = self.get_db()
        try:
            return db.query(StoredModel)\
                .filter(StoredModel.model_type == model_type)\
                .order_by(StoredModel.timestamp.desc())\
                .first()
        finally:
            db.close()

# Create global database instance
db = Database()
        try:
            data.update({
                "factory_name": factory_name,
                "medicine_name": medicine_name
            })
            
            response = self.client.table("sensor_data").insert(data).execute()
            return response.data
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
    async def get_training_data(self, factory_name: str, medicine_name: str):
        """Retrieve training data for a specific factory and medicine."""
        try:
            response = self.client.table("sensor_data")\
                .select("*")\
                .eq("factory_name", factory_name)\
                .eq("medicine_name", medicine_name)\
                .execute()
                
            return response.data
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
            
    async def store_model(self, factory_name: str, medicine_name: str, model_type: str, model_data: bytes):
        """Store trained model in Supabase Storage."""
        try:
            file_name = f"{factory_name}_{medicine_name}_{model_type}.pkl"
            
            # Store in Supabase Storage
            response = self.client.storage\
                .from_("models")\
                .upload(file_name, model_data, {"upsert": True})
                
            return response
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")
            
    async def load_model(self, factory_name: str, medicine_name: str, model_type: str) -> Optional[bytes]:
        """Load model from Supabase Storage."""
        try:
            file_name = f"{factory_name}_{medicine_name}_{model_type}.pkl"
            
            # Download from Supabase Storage
            response = self.client.storage\
                .from_("models")\
                .download(file_name)
                
            return response
            
        except Exception as e:
            return None  # Return None if model doesn't exist
            
    async def get_recent_data(self, factory_name: str, medicine_name: str, limit: int = 100):
        """Get recent sensor readings for a specific factory and medicine."""
        try:
            response = self.client.table("sensor_data")\
                .select("*")\
                .eq("factory_name", factory_name)\
                .eq("medicine_name", medicine_name)\
                .order("timestamp", desc=True)\
                .limit(limit)\
                .execute()
                
            return response.data
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Create global database instance
db = Database()