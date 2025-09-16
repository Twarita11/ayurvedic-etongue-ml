from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Ayurvedic E-Tongue System",
    description="API for Ayurvedic medicine analysis using electronic tongue sensors",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.routers import data_routes, train_routes, predict_routes

app.include_router(data_routes.router, prefix="/api", tags=["data"])
app.include_router(train_routes.router, prefix="/api", tags=["training"])
app.include_router(predict_routes.router, prefix="/api", tags=["prediction"])

@app.get("/")
async def root():
    """Root endpoint to check API status."""
    return {
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }