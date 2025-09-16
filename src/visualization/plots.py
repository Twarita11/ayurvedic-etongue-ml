"""Visualization module for Ayurvedic medicine sensor analysis."""

import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
import pandas as pd
from typing import Dict, List, Optional

class Visualizer:
    def __init__(self, 
                 sensor_columns: List[str] = ['R', 'S', 'T', 'U', 'V', 'W'],
                 temp_column: str = 'Temperature'):
        """Initialize the visualizer.
        
        Args:
            sensor_columns: List of sensor column names
            temp_column: Temperature column name
        """
        self.sensor_columns = sensor_columns
        self.temp_column = temp_column
        
    def plot_sensor_readings(self, 
                           df: pd.DataFrame, 
                           medicine_name: Optional[str] = None) -> go.Figure:
        """Plot real-time sensor readings.
        
        Args:
            df: DataFrame containing sensor readings
            medicine_name: Optional filter for specific medicine
            
        Returns:
            Plotly figure object
        """
        if medicine_name:
            df = df[df['Medicine_Name'] == medicine_name]
            
        fig = make_subplots(rows=2, cols=1,
                           subplot_titles=('Sensor Readings', 'Temperature'))
        
        # Plot sensor readings
        for col in self.sensor_columns:
            fig.add_trace(
                go.Scatter(x=df['Reading_ID'],
                          y=df[col],
                          name=col,
                          mode='lines+markers'),
                row=1, col=1
            )
            
        # Plot temperature
        fig.add_trace(
            go.Scatter(x=df['Reading_ID'],
                      y=df[self.temp_column],
                      name=self.temp_column,
                      mode='lines+markers'),
            row=2, col=1
        )
        
        fig.update_layout(
            height=800,
            title_text='Sensor Readings Over Time',
            showlegend=True
        )
        
        return fig
    
    def plot_dilution_curves(self, df: pd.DataFrame) -> go.Figure:
        """Plot sensor response vs dilution levels.
        
        Args:
            df: DataFrame containing sensor data
            
        Returns:
            Plotly figure object
        """
        fig = make_subplots(rows=1, cols=1)
        
        for medicine in df['Medicine_Name'].unique():
            med_df = df[df['Medicine_Name'] == medicine]
            
            for col in self.sensor_columns:
                fig.add_trace(
                    go.Scatter(
                        x=med_df['Dilution_Percent'],
                        y=med_df[col],
                        name=f"{medicine} - {col}",
                        mode='lines+markers'
                    )
                )
                
        fig.update_layout(
            title='Sensor Response vs Dilution Level',
            xaxis_title='Dilution Percentage',
            yaxis_title='Sensor Reading',
            showlegend=True
        )
        
        return fig
    
    def plot_model_performance(self, 
                             cv_scores: Dict[str, Dict[str, np.ndarray]]) -> go.Figure:
        """Plot model performance metrics.
        
        Args:
            cv_scores: Dictionary of cross-validation scores
            
        Returns:
            Plotly figure object
        """
        fig = make_subplots(rows=3, cols=1,
                           subplot_titles=('Dilution Prediction',
                                         'Medicine Classification',
                                         'Effectiveness Prediction'))
        
        row = 1
        for target in cv_scores:
            for model_name, scores in cv_scores[target].items():
                fig.add_trace(
                    go.Box(y=scores,
                          name=f"{model_name.upper()}",
                          showlegend=False),
                    row=row, col=1
                )
            row += 1
            
        fig.update_layout(
            height=900,
            title_text='Model Performance Metrics (Cross-Validation)',
            showlegend=False
        )
        
        # Update y-axis titles
        fig.update_yaxes(title_text='Negative MSE', row=1, col=1)
        fig.update_yaxes(title_text='Accuracy', row=2, col=1)
        fig.update_yaxes(title_text='Negative MSE', row=3, col=1)
        
        return fig
    
    def plot_prediction_confidence(self,
                                 predictions: Dict[str, Dict[str, np.ndarray]],
                                 true_values: Optional[Dict[str, np.ndarray]] = None) -> go.Figure:
        """Plot prediction confidence intervals.
        
        Args:
            predictions: Dictionary of predictions and confidence scores
            true_values: Optional dictionary of true values for comparison
            
        Returns:
            Plotly figure object
        """
        fig = make_subplots(rows=3, cols=1,
                           subplot_titles=('Dilution Prediction',
                                         'Medicine Classification',
                                         'Effectiveness Prediction'))
        
        row = 1
        for target in predictions:
            pred = predictions[target]['predictions']
            conf = predictions[target]['confidence']
            
            # Sort predictions and confidence scores
            sort_idx = np.argsort(pred)
            pred_sorted = pred[sort_idx]
            conf_sorted = conf[sort_idx]
            
            # Plot predictions with confidence intervals
            fig.add_trace(
                go.Scatter(
                    x=np.arange(len(pred)),
                    y=pred_sorted,
                    mode='lines',
                    name=f'{target} prediction',
                    line=dict(color='blue')
                ),
                row=row, col=1
            )
            
            # Add confidence intervals
            fig.add_trace(
                go.Scatter(
                    x=np.concatenate([np.arange(len(pred)), np.arange(len(pred))[::-1]]),
                    y=np.concatenate([pred_sorted + conf_sorted, 
                                    (pred_sorted - conf_sorted)[::-1]]),
                    fill='toself',
                    fillcolor='rgba(0,0,255,0.2)',
                    line=dict(color='rgba(255,255,255,0)'),
                    name=f'{target} confidence'
                ),
                row=row, col=1
            )
            
            # Add true values if provided
            if true_values and target in true_values:
                true_sorted = true_values[target][sort_idx]
                fig.add_trace(
                    go.Scatter(
                        x=np.arange(len(pred)),
                        y=true_sorted,
                        mode='markers',
                        name=f'{target} true',
                        marker=dict(color='red')
                    ),
                    row=row, col=1
                )
            
            row += 1
            
        fig.update_layout(
            height=900,
            title_text='Predictions with Confidence Intervals',
            showlegend=True
        )
        
        return fig
    
    def plot_feature_importance(self,
                              importance_scores: np.ndarray,
                              feature_names: List[str]) -> go.Figure:
        """Plot feature importance scores.
        
        Args:
            importance_scores: Array of feature importance scores
            feature_names: List of feature names
            
        Returns:
            Plotly figure object
        """
        # Sort features by importance
        sort_idx = np.argsort(importance_scores)
        scores_sorted = importance_scores[sort_idx]
        names_sorted = np.array(feature_names)[sort_idx]
        
        fig = go.Figure()
        
        fig.add_trace(
            go.Bar(
                x=scores_sorted,
                y=names_sorted,
                orientation='h'
            )
        )
        
        fig.update_layout(
            title='Feature Importance Scores',
            xaxis_title='Importance Score',
            yaxis_title='Feature',
            height=600
        )
        
        return fig