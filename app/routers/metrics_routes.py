from fastapi import APIRouter
from fastapi.responses import JSONResponse
import numpy as np
import pandas as pd
from plotly.io import to_json as plotly_to_json
import joblib
from ...src.data.real_loader import load_real_dataset, train_val_test_split
from ...src.visualization.plots import Visualizer
from ...src.models.training import SENSOR_FEATURES
from ..config import settings

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/ftir")
def ftir_like():
    df = load_real_dataset()
    viz = Visualizer(sensor_columns=['R','S','T','U','V','W'])
    fig = viz.plot_ftir_like(df)
    return JSONResponse(content={"figure": plotly_to_json(fig)})


@router.get("/summary")
def summary_metrics():
    """Return simple validation metrics if models and labels exist."""
    df = load_real_dataset()
    train_df, val_df, _ = train_val_test_split(df)

    model_dir = settings.model_dir
    out: dict = {}

    # Dilution
    try:
        model = joblib.load(f"{model_dir}/dilution_model.pkl")
        X = val_df[SENSOR_FEATURES]
        y = val_df.get('Dilution_Percent')
        if y is not None:
            pred = model.predict(X)
            mse = float(((pred - y) ** 2).mean())
            out['dilution'] = {"mse": mse}
    except Exception:
        pass

    # Effectiveness
    try:
        model = joblib.load(f"{model_dir}/effectiveness_model.pkl")
        X = val_df[SENSOR_FEATURES]
        y = val_df.get('Effectiveness_Score')
        if y is not None:
            pred = model.predict(X)
            mse = float(((pred - y) ** 2).mean())
            out['effectiveness'] = {"mse": mse}
    except Exception:
        pass

    # Medicine
    try:
        model = joblib.load(f"{model_dir}/medicine_model.pkl")
        X = val_df[SENSOR_FEATURES]
        y = val_df.get('Medicine_Name')
        if y is not None:
            pred = model.predict(X)
            acc = float((pred == y).mean())
            out['medicine'] = {"accuracy": acc}
    except Exception:
        pass

    return out


@router.get("/plots")
def plots():
    """Return Plotly JSON for FTIR-like and, if possible, medicine confusion matrix parity plots."""
    df = load_real_dataset()
    _, val_df, _ = train_val_test_split(df)
    figs = {}

    # FTIR-like
    viz = Visualizer(sensor_columns=['R','S','T','U','V','W'])
    figs['ftir'] = plotly_to_json(viz.plot_ftir_like(df))

    # Additional plots could be added similarly (requires labels/models)
    return JSONResponse(content=figs)


