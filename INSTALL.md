# Quick Setup Guide

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Twarita11/ayurvedic-etongue-ml.git
cd ayurvedic-etongue-ml
```

2. Create and activate Python virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
```

3. Install required packages:
```bash
pip install -r requirements.txt
```

## Running the Analysis

1. Open and run the Jupyter notebook:
```bash
jupyter notebook notebooks/ayurvedic_analysis.ipynb
```

The notebook contains:
- Data preprocessing and validation
- Feature engineering pipeline
- Model training and evaluation
- Visualization of results
- Real-time prediction examples

## Using the API

Start the prediction API:
```bash
uvicorn src.api.endpoints:app --reload
```

Access API documentation at: http://localhost:8000/docs

## Data Format

Follow the data collection template in `docs/data_collection_guide.md` for:
- Sensor reading format
- Dilution levels
- Required measurements
- Quality control