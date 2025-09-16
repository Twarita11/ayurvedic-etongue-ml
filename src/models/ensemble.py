"""Ensemble model implementation for Ayurvedic medicine sensor analysis."""

import numpy as np
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.svm import SVR, SVC
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, Dropout, Input
from tensorflow.keras.optimizers import Adam
import joblib
import json

class EnsembleModel:
    def __init__(self, model_path: Optional[str] = None):
        """Initialize the ensemble model.
        
        Args:
            model_path: Path to load saved models from
        """
        self.models = {
            'dilution': {},
            'medicine': {},
            'effectiveness': {}
        }
        self.label_encoder = LabelEncoder()
        
        if model_path:
            self.load_models(model_path)
            
    def _create_neural_network(self, 
                             input_dim: int,
                             output_dim: int,
                             problem_type: str = 'regression') -> Model:
        """Create a neural network model.
        
        Args:
            input_dim: Number of input features
            output_dim: Number of output dimensions
            problem_type: Type of problem ('regression' or 'classification')
            
        Returns:
            Compiled Keras model
        """
        model = Sequential([
            Dense(64, activation='relu', input_dim=input_dim),
            Dropout(0.2),
            Dense(32, activation='relu'),
            Dropout(0.2),
            Dense(output_dim, activation='linear' if problem_type == 'regression' else 'softmax')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='mse' if problem_type == 'regression' else 'sparse_categorical_crossentropy',
            metrics=['mae'] if problem_type == 'regression' else ['accuracy']
        )
        
        return model
    
    def train(self, 
             X: np.ndarray,
             y_dilution: np.ndarray,
             y_medicine: np.ndarray,
             y_effectiveness: np.ndarray,
             cv_folds: int = 5) -> Dict[str, List[float]]:
        """Train the ensemble models.
        
        Args:
            X: Input features
            y_dilution: Dilution percentage targets
            y_medicine: Medicine type targets
            y_effectiveness: Effectiveness score targets
            cv_folds: Number of cross-validation folds
            
        Returns:
            Dictionary of cross-validation scores
        """
        cv_scores = {}
        
        # Encode medicine labels
        y_medicine_encoded = self.label_encoder.fit_transform(y_medicine)
        
        # Train dilution models
        self.models['dilution']['rf'] = RandomForestRegressor(n_estimators=100, random_state=42)
        self.models['dilution']['svm'] = SVR(kernel='rbf')
        self.models['dilution']['nn'] = self._create_neural_network(X.shape[1], 1, 'regression')
        
        cv_scores['dilution'] = {
            'rf': cross_val_score(self.models['dilution']['rf'], X, y_dilution, cv=cv_folds, scoring='neg_mean_squared_error'),
            'svm': cross_val_score(self.models['dilution']['svm'], X, y_dilution, cv=cv_folds, scoring='neg_mean_squared_error')
        }
        
        # Train medicine type models
        self.models['medicine']['rf'] = RandomForestClassifier(n_estimators=100, random_state=42)
        self.models['medicine']['svm'] = SVC(kernel='rbf', probability=True)
        self.models['medicine']['nn'] = self._create_neural_network(
            X.shape[1], 
            len(self.label_encoder.classes_), 
            'classification'
        )
        
        cv_scores['medicine'] = {
            'rf': cross_val_score(self.models['medicine']['rf'], X, y_medicine_encoded, cv=cv_folds, scoring='accuracy'),
            'svm': cross_val_score(self.models['medicine']['svm'], X, y_medicine_encoded, cv=cv_folds, scoring='accuracy')
        }
        
        # Train effectiveness models
        self.models['effectiveness']['rf'] = RandomForestRegressor(n_estimators=100, random_state=42)
        self.models['effectiveness']['svm'] = SVR(kernel='rbf')
        self.models['effectiveness']['nn'] = self._create_neural_network(X.shape[1], 1, 'regression')
        
        cv_scores['effectiveness'] = {
            'rf': cross_val_score(self.models['effectiveness']['rf'], X, y_effectiveness, cv=cv_folds, scoring='neg_mean_squared_error'),
            'svm': cross_val_score(self.models['effectiveness']['svm'], X, y_effectiveness, cv=cv_folds, scoring='neg_mean_squared_error')
        }
        
        # Fit all models on full dataset
        for target in self.models:
            for model_name, model in self.models[target].items():
                if model_name != 'nn':
                    y = y_medicine_encoded if target == 'medicine' else (
                        y_dilution if target == 'dilution' else y_effectiveness
                    )
                    model.fit(X, y)
                else:
                    y = y_medicine_encoded if target == 'medicine' else (
                        y_dilution.reshape(-1, 1) if target == 'dilution' else 
                        y_effectiveness.reshape(-1, 1)
                    )
                    model.fit(X, y, epochs=50, batch_size=32, verbose=0)
        
        return cv_scores
    
    def predict(self, X: np.ndarray) -> Dict[str, Dict[str, np.ndarray]]:
        """Generate predictions from all models.
        
        Args:
            X: Input features
            
        Returns:
            Dictionary of predictions and confidence scores
        """
        predictions = {}
        
        for target in self.models:
            predictions[target] = {
                'predictions': [],
                'confidence': []
            }
            
            for model_name, model in self.models[target].items():
                if target == 'medicine':
                    if model_name != 'nn':
                        pred_proba = model.predict_proba(X)
                        pred = self.label_encoder.inverse_transform(pred_proba.argmax(axis=1))
                        conf = pred_proba.max(axis=1)
                    else:
                        pred_proba = model.predict(X)
                        pred = self.label_encoder.inverse_transform(pred_proba.argmax(axis=1))
                        conf = pred_proba.max(axis=1)
                else:
                    if model_name != 'nn':
                        pred = model.predict(X)
                        # Use model-specific confidence estimation
                        if model_name == 'rf':
                            conf = 1.0 - model.predict(X, return_std=True)[1]
                        else:
                            conf = np.ones_like(pred)  # placeholder for SVM
                    else:
                        pred = model.predict(X).flatten()
                        conf = np.ones_like(pred)  # placeholder for NN
                
                predictions[target]['predictions'].append(pred)
                predictions[target]['confidence'].append(conf)
            
            # Average predictions and confidence scores
            predictions[target]['predictions'] = np.mean(predictions[target]['predictions'], axis=0)
            predictions[target]['confidence'] = np.mean(predictions[target]['confidence'], axis=0)
        
        return predictions
    
    def save_models(self, path: str):
        """Save all models and encoders.
        
        Args:
            path: Directory path to save models
        """
        # Save sklearn models and label encoder
        for target in self.models:
            for model_name, model in self.models[target].items():
                if model_name != 'nn':
                    joblib.dump(model, f"{path}/{target}_{model_name}.joblib")
                else:
                    model.save(f"{path}/{target}_{model_name}")
        
        joblib.dump(self.label_encoder, f"{path}/label_encoder.joblib")
        
        # Save class names
        with open(f"{path}/class_names.json", 'w') as f:
            json.dump(
                {'medicine_types': self.label_encoder.classes_.tolist()},
                f
            )
    
    def load_models(self, path: str):
        """Load all models and encoders.
        
        Args:
            path: Directory path to load models from
        """
        for target in self.models:
            for model_name in ['rf', 'svm']:
                self.models[target][model_name] = joblib.load(
                    f"{path}/{target}_{model_name}.joblib"
                )
                self.models[target]['nn'] = tf.keras.models.load_model(
                    f"{path}/{target}_nn"
                )
        
        self.label_encoder = joblib.load(f"{path}/label_encoder.joblib")