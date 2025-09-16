from pydantic_settings import BaseSettings
import os
from pathlib import Path

class Settings(BaseSettings):
    app_name: str = "Ayurvedic E-tongue API"
    version: str = "1.0.0"
    
    # Base paths
    base_dir: Path = Path(__file__).parent.parent
    model_dir: Path = base_dir / "models"
    data_dir: Path = base_dir / "data"
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # Database settings
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    
    # Supabase settings
    supabase_url: str = ""
    supabase_key: str = ""
    
    # Model paths
    medicine_model_path: str = "models/medicine_model.pkl"
    effectiveness_model_path: str = "models/effectiveness_model.pkl"
    dilution_model_path: str = "models/dilution_model.pkl"
    
    # Frontend settings
    api_url: str = "http://localhost:8000"
    
    # CORS Settings
    cors_origins: list = ["*"]
    cors_headers: list = ["*"]
    
    # Model settings
    model_version: str = "1.0.0"
    retrain_interval_hours: int = 24
    min_samples_for_training: int = 100
    
    class Config:
        env_file = ".env"

    def setup(self):
        """Create necessary directories."""
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        return self

settings = Settings().setup()