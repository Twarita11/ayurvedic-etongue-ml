"""Synthetic dataset loader utilities.

Loads labeled synthetic CSVs in ayurvedic-ml-pipeline/data/ and returns a unified
DataFrame with columns: R..W, optional Temperature, mq3_ppm (filled 0.0),
Dilution_Percent, Medicine_Name, Effectiveness_Score, taste_* columns.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split


TASTE_NAMES = [
    "sweet",
    "sour",
    "salty",
    "bitter",
    "pungent",
    "astringent",
]


@dataclass
class SyntheticDataConfig:
    with_tastes_csv: Path = Path(
        "ayurvedic-ml-pipeline/data/sensor_readings_with_tastes.csv"
    )
    basic_csv: Path = Path("ayurvedic-ml-pipeline/data/sensor_readings.csv")
    test_size: float = 0.15
    val_size: float = 0.15
    random_state: int = 42


def _derive_taste_columns(df: pd.DataFrame) -> pd.DataFrame:
    # Initialize taste columns as zeros
    for t in TASTE_NAMES:
        col = f"taste_{t}"
        if col not in df.columns:
            df[col] = 0.0

    # Map Primary_Taste / Secondary_Taste to 1.0 flags
    for taste_col in ["Primary_Taste", "Secondary_Taste"]:
        if taste_col in df.columns:
            valid = df[taste_col].astype(str).str.lower()
            for t in TASTE_NAMES:
                mask = valid == t
                df.loc[mask, f"taste_{t}"] = 1.0
    return df


def load_synthetic_dataset(cfg: Optional[SyntheticDataConfig] = None) -> pd.DataFrame:
    cfg = cfg or SyntheticDataConfig()

    if cfg.with_tastes_csv.exists():
        df = pd.read_csv(cfg.with_tastes_csv)
        df = _derive_taste_columns(df)
    elif cfg.basic_csv.exists():
        df = pd.read_csv(cfg.basic_csv)
        # No taste columns available; proceed without
    else:
        raise FileNotFoundError("No synthetic CSVs found under ayurvedic-ml-pipeline/data/")

    # Ensure required feature columns exist
    for col in ["R", "S", "T", "U", "V", "W"]:
        if col not in df.columns:
            raise ValueError(f"Synthetic CSV missing sensor column: {col}")

    # Add mq3_ppm as 0.0 so features align with real-data pipelines
    if "mq3_ppm" not in df.columns:
        df["mq3_ppm"] = 0.0

    # Keep only relevant columns if present
    keep = [
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "mq3_ppm",
        "Temperature",
        "Dilution_Percent",
        "Medicine_Name",
        "Effectiveness_Score",
    ] + [f"taste_{t}" for t in TASTE_NAMES]
    df = df[[c for c in keep if c in df.columns]].copy()

    return df


def train_val_test_split(
    df: pd.DataFrame, cfg: Optional[SyntheticDataConfig] = None
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    cfg = cfg or SyntheticDataConfig()
    idx = np.arange(len(df))
    idx_trainval, idx_test = train_test_split(
        idx, test_size=cfg.test_size, random_state=cfg.random_state, shuffle=True
    )
    rel_val_size = cfg.val_size / (1.0 - cfg.test_size)
    idx_train, idx_val = train_test_split(
        idx_trainval, test_size=rel_val_size, random_state=cfg.random_state, shuffle=True
    )
    return (
        df.iloc[idx_train].reset_index(drop=True),
        df.iloc[idx_val].reset_index(drop=True),
        df.iloc[idx_test].reset_index(drop=True),
    )


