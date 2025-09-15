"""Feature engineering module for Ayurvedic medicine sensor analysis."""

import numpy as np
from typing import List, Dict
from sklearn.decomposition import PCA

class FeatureEngineer:
    def __init__(self, n_components: int = 3):
        """Initialize feature engineering module.
        
        Args:
            n_components: Number of PCA components to use
        """
        self.n_components = n_components
        self.pca = PCA(n_components=n_components)
        
    def calculate_ratios(self, sensor_values: np.ndarray) -> np.ndarray:
        """Calculate ratios between sensor readings.
        
        Args:
            sensor_values: Array of shape (n_samples, n_sensors)
            
        Returns:
            Array of sensor ratios
        """
        n_sensors = sensor_values.shape[1]
        ratios = []
        
        # Calculate ratios between all pairs of sensors
        for i in range(n_sensors):
            for j in range(i + 1, n_sensors):
                ratio = sensor_values[:, i] / (sensor_values[:, j] + 1e-10)
                ratios.append(ratio)
                
        return np.column_stack(ratios)
    
    def spectral_derivatives(self, sensor_values: np.ndarray) -> np.ndarray:
        """Calculate first and second derivatives of spectral data.
        
        Args:
            sensor_values: Array of shape (n_samples, n_sensors)
            
        Returns:
            Array containing derivatives
        """
        # First derivative (difference between adjacent sensors)
        first_derivative = np.diff(sensor_values, axis=1)
        
        # Second derivative
        second_derivative = np.diff(first_derivative, axis=1)
        
        # Pad arrays to maintain original dimensions
        first_derivative = np.pad(first_derivative, 
                                ((0, 0), (0, 1)), 
                                mode='edge')
        second_derivative = np.pad(second_derivative, 
                                 ((0, 0), (0, 2)), 
                                 mode='edge')
        
        return np.concatenate([first_derivative, second_derivative], axis=1)
    
    def extract_statistical_features(self, sensor_values: np.ndarray) -> np.ndarray:
        """Extract statistical features from sensor readings.
        
        Args:
            sensor_values: Array of shape (n_samples, n_sensors)
            
        Returns:
            Array of statistical features
        """
        # Calculate various statistical measures
        mean = np.mean(sensor_values, axis=1, keepdims=True)
        std = np.std(sensor_values, axis=1, keepdims=True)
        max_val = np.max(sensor_values, axis=1, keepdims=True)
        min_val = np.min(sensor_values, axis=1, keepdims=True)
        range_val = max_val - min_val
        
        # Combine all statistical features
        stats = np.concatenate([
            mean, std, max_val, min_val, range_val
        ], axis=1)
        
        return stats
    
    def apply_pca(self, features: np.ndarray, fit: bool = True) -> np.ndarray:
        """Apply PCA transformation to features.
        
        Args:
            features: Input feature array
            fit: Whether to fit PCA or use existing transformation
            
        Returns:
            PCA-transformed features
        """
        if fit:
            return self.pca.fit_transform(features)
        return self.pca.transform(features)
    
    def engineer_features(self, 
                        sensor_values: np.ndarray, 
                        temperature: np.ndarray,
                        fit: bool = True) -> Dict[str, np.ndarray]:
        """Engineer features from raw sensor data.
        
        Args:
            sensor_values: Array of sensor readings
            temperature: Array of temperature values
            fit: Whether to fit transformations or use existing ones
            
        Returns:
            Dictionary of engineered features
        """
        # Calculate sensor ratios
        ratios = self.calculate_ratios(sensor_values)
        
        # Calculate spectral derivatives
        derivatives = self.spectral_derivatives(sensor_values)
        
        # Extract statistical features
        stats = self.extract_statistical_features(sensor_values)
        
        # Combine all features
        combined_features = np.concatenate([
            sensor_values,
            ratios,
            derivatives,
            stats,
            temperature.reshape(-1, 1)
        ], axis=1)
        
        # Apply PCA
        pca_features = self.apply_pca(combined_features, fit=fit)
        
        return {
            'original': sensor_values,
            'ratios': ratios,
            'derivatives': derivatives,
            'statistics': stats,
            'temperature': temperature,
            'pca': pca_features,
            'combined': combined_features
        }