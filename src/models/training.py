"""Training utilities for taste, dilution, effectiveness, and medicine models.

These functions expect a DataFrame containing sensor features (R..W, mq3_ppm, optional temperature)
and supervised targets. If a target is missing, the caller should skip training.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import cross_val_score
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib


SENSOR_FEATURES = ["R", "S", "T", "U", "V", "W", "mq3_ppm"]


@dataclass
class TrainConfig:
    model_dir: Path = Path("ayurvedic-ml-pipeline/models")
    random_state: int = 42
    n_jobs: int = -1


def _numeric_pipeline() -> Pipeline:
    return Pipeline([
        ("scaler", StandardScaler()),
    ])


def _build_preprocessor(numeric_features: List[str]) -> ColumnTransformer:
    return ColumnTransformer([
        ("num", _numeric_pipeline(), numeric_features),
    ])


def train_dilution_regressor(train_df: pd.DataFrame, cfg: Optional[TrainConfig] = None) -> Pipeline:
    cfg = cfg or TrainConfig()
    features = SENSOR_FEATURES
    target = "Dilution_Percent"
    X = train_df[features]
    y = train_df[target]

    pre = _build_preprocessor(features)
    model = Ridge(random_state=cfg.random_state)
    pipe = Pipeline([("pre", pre), ("model", model)])
    pipe.fit(X, y)
    return pipe


def train_effectiveness_regressor(train_df: pd.DataFrame, cfg: Optional[TrainConfig] = None) -> Pipeline:
    cfg = cfg or TrainConfig()
    features = SENSOR_FEATURES
    target = "Effectiveness_Score"
    X = train_df[features]
    y = train_df[target]

    pre = _build_preprocessor(features)
    model = RandomForestRegressor(random_state=cfg.random_state, n_estimators=300, n_jobs=cfg.n_jobs)
    pipe = Pipeline([("pre", pre), ("model", model)])
    pipe.fit(X, y)
    return pipe


def train_medicine_classifier(train_df: pd.DataFrame, cfg: Optional[TrainConfig] = None) -> Pipeline:
    cfg = cfg or TrainConfig()
    features = SENSOR_FEATURES
    target = "Medicine_Name"
    X = train_df[features]
    y = train_df[target]

    pre = _build_preprocessor(features)
    model = RandomForestClassifier(random_state=cfg.random_state, n_estimators=400, n_jobs=cfg.n_jobs)
    pipe = Pipeline([("pre", pre), ("model", model)])
    pipe.fit(X, y)
    return pipe


def train_taste_multiregressor(train_df: pd.DataFrame, taste_cols: List[str], cfg: Optional[TrainConfig] = None) -> Pipeline:
    """Train a multi-output regressor for taste intensities (sweet/sour/... columns)."""
    cfg = cfg or TrainConfig()
    features = SENSOR_FEATURES
    X = train_df[features]
    Y = train_df[taste_cols]

    pre = _build_preprocessor(features)
    base = RandomForestRegressor(random_state=cfg.random_state, n_estimators=300, n_jobs=cfg.n_jobs)
    model = MultiOutputRegressor(base)
    pipe = Pipeline([("pre", pre), ("model", model)])
    pipe.fit(X, Y)
    return pipe


def evaluate_regression(model: Pipeline, df: pd.DataFrame, target: str, features: List[str] = SENSOR_FEATURES) -> Dict[str, float]:
    X = df[features]
    y = df[target]
    pred = model.predict(X)
    mse = mean_squared_error(y, pred)
    r2 = r2_score(y, pred)
    return {"mse": float(mse), "r2": float(r2)}


def evaluate_classification(model: Pipeline, df: pd.DataFrame, target: str, features: List[str] = SENSOR_FEATURES) -> Dict[str, object]:
    X = df[features]
    y = df[target]
    pred = model.predict(X)
    acc = accuracy_score(y, pred)
    cm = confusion_matrix(y, pred)
    report = classification_report(y, pred, output_dict=True)
    return {"accuracy": float(acc), "confusion_matrix": cm, "report": report}


def save_model(model: Pipeline, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)



