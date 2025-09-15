"""Data preprocessing module for Ayurvedic medicine sensor analysis."""

import pandas as pd
import numpy as np
from typing import Tuple, Dict
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split

class DataPreprocessor:
    def __init__(self, 
                 sensor_columns: list = ['R', 'S', 'T', 'U', 'V', 'W'],
                 temp_column: str = 'Temperature',
                 target_columns: list = ['Dilution_Percent', 'Medicine_Name', 'Effectiveness_Score']):
        """Initialize the data preprocessor.
        
        Args:
            sensor_columns: List of sensor column names
            temp_column: Temperature column name
            target_columns: List of target variable column names
        """
        self.sensor_columns = sensor_columns
        self.temp_column = temp_column
        self.target_columns = target_columns
        self.scalers = {}
        
    def load_data(self, file_path: str) -> pd.DataFrame:
        """Load and validate CSV data.
        
        Args:
            file_path: Path to the CSV file
            
        Returns:
            Validated DataFrame
        """
        try:
            df = pd.read_csv(file_path)
            required_columns = (
                self.sensor_columns + 
                [self.temp_column] + 
                self.target_columns + 
                ['Reading_ID']
            )
            
            # Validate columns
            missing_cols = set(required_columns) - set(df.columns)
            if missing_cols:
                raise ValueError(f"Missing required columns: {missing_cols}")
            
            # Validate data types
            numeric_cols = self.sensor_columns + [self.temp_column, 'Dilution_Percent', 'Effectiveness_Score']
            for col in numeric_cols:
                if not pd.to_numeric(df[col], errors='coerce').notna().all():
                    raise ValueError(f"Column {col} contains non-numeric values")
            
            return df
            
        except Exception as e:
            raise Exception(f"Error loading data: {str(e)}")
    
    def temperature_compensation(self, 
                              df: pd.DataFrame, 
                              reference_temp: float = 25.0) -> pd.DataFrame:
        """Apply temperature compensation to sensor readings.
        
        Args:
            df: Input DataFrame
            reference_temp: Reference temperature for normalization
            
        Returns:
            DataFrame with temperature-compensated readings
        """
        # Simple linear temperature compensation
        temp_diff = df[self.temp_column] - reference_temp
        
        df_comp = df.copy()
        for col in self.sensor_columns:
            # Apply temperature coefficient (this is a simplified model)
            temp_coef = 0.002  # Example coefficient, should be calibrated
            df_comp[col] = df[col] * (1 + temp_coef * temp_diff)
        
        return df_comp
    
    def normalize_features(self, 
                         df: pd.DataFrame, 
                         fit: bool = True) -> pd.DataFrame:
        """Normalize sensor readings using StandardScaler.
        
        Args:
            df: Input DataFrame
            fit: Whether to fit the scaler or use existing transformation
            
        Returns:
            DataFrame with normalized features
        """
        df_norm = df.copy()
        
        # Normalize sensor readings
        if fit:
            self.scalers['sensors'] = StandardScaler()
            df_norm[self.sensor_columns] = self.scalers['sensors'].fit_transform(df[self.sensor_columns])
        else:
            df_norm[self.sensor_columns] = self.scalers['sensors'].transform(df[self.sensor_columns])
        
        # Normalize temperature
        if fit:
            self.scalers['temp'] = MinMaxScaler()
            df_norm[[self.temp_column]] = self.scalers['temp'].fit_transform(df[[self.temp_column]])
        else:
            df_norm[[self.temp_column]] = self.scalers['temp'].transform(df[[self.temp_column]])
            
        return df_norm
    
    def prepare_data(self, 
                    df: pd.DataFrame, 
                    test_size: float = 0.2,
                    random_state: int = 42) -> Tuple[Dict[str, np.ndarray], Dict[str, np.ndarray]]:
        """Prepare data for training by splitting into train/test sets.
        
        Args:
            df: Input DataFrame
            test_size: Proportion of data to use for testing
            random_state: Random seed for reproducibility
            
        Returns:
            Tuple of dictionaries containing training and test data
        """
        # Apply temperature compensation
        df_comp = self.temperature_compensation(df)
        
        # Normalize features
        df_norm = self.normalize_features(df_comp)
        
        # Prepare feature matrix
        X = np.hstack([
            df_norm[self.sensor_columns].values,
            df_norm[[self.temp_column]].values
        ])
        
        # Prepare target variables
        y_dilution = df['Dilution_Percent'].values
        y_medicine = df['Medicine_Name'].values
        y_effectiveness = df['Effectiveness_Score'].values
        
        # Split data
        X_train, X_test, y_dilution_train, y_dilution_test, \
        y_medicine_train, y_medicine_test, y_effectiveness_train, y_effectiveness_test = \
            train_test_split(X, y_dilution, y_medicine, y_effectiveness,
                           test_size=test_size, random_state=random_state)
        
        # Prepare return dictionaries
        train_data = {
            'X': X_train,
            'y_dilution': y_dilution_train,
            'y_medicine': y_medicine_train,
            'y_effectiveness': y_effectiveness_train
        }
        
        test_data = {
            'X': X_test,
            'y_dilution': y_dilution_test,
            'y_medicine': y_medicine_test,
            'y_effectiveness': y_effectiveness_test
        }
        
        return train_data, test_data