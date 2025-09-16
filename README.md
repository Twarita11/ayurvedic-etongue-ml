# Ayurvedic Medicine Sensor Analysis ML Pipeline

A machine learning pipeline for analyzing NIR wavelength sensor data from Ayurvedic medicines. The system predicts dilution percentages, classifies medicine types, and estimates therapeutic effectiveness using an ensemble of machine learning models.

## Project Structure

```
ayurvedic-ml-pipeline/
├── data/               # Store raw and processed data
├── models/            # Saved model files
├── notebooks/         # Jupyter notebooks for exploration
├── src/              # Source code
│   ├── data/         # Data loading and preprocessing
│   ├── features/     # Feature engineering
│   ├── models/       # ML model implementations
│   ├── visualization/# Data visualization
│   └── api/          # FastAPI endpoints
├── tests/            # Unit tests
└── requirements.txt  # Project dependencies
```

## Features

- Data preprocessing and validation for NIR sensor readings
- Feature engineering with temperature compensation
- Ensemble ML model (Random Forest, SVM, Neural Network)
- Real-time visualization of sensor data
- REST API for predictions
- Comprehensive test suite

## Requirements

- Python 3.8+
- See requirements.txt for Python package dependencies

## Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Data Preparation:
   - Place your CSV data files in the `data/` directory
   - Format: R,S,T,U,V,W,Temperature,Dilution_Percent,Medicine_Name,Effectiveness_Score,Reading_ID

2. Training Models:
   ```bash
   python src/models/ensemble.py --data_path data/training_data.csv
   ```

3. Starting the API:
   ```bash
   uvicorn src.api.endpoints:app --reload
   ```

4. Jupyter Notebooks:
   ```bash
   jupyter notebook notebooks/
   ```

## API Endpoints

- `POST /predict/dilution`: Predict dilution percentage
- `POST /predict/medicine`: Classify medicine type
- `POST /predict/effectiveness`: Estimate therapeutic effectiveness

## Testing

Run the test suite:
```bash
pytest tests/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.