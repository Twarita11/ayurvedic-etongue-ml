from supabase import create_client
import os
from typing import Optional

class Database:
    def __init__(self):
        """Initialize Supabase client."""
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Supabase credentials not found in environment variables")
            
        self.client = create_client(self.supabase_url, self.supabase_key)
        
    async def store_sensor_data(self, factory_name: str, medicine_name: str, data: dict):
        """Store sensor readings in the database."""
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