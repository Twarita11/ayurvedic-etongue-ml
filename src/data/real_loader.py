"""Utilities to load and preprocess the real AS7263 + MQ3 dataset.

This module focuses on the CSV found at data/real/data.csv with columns:
- timestamp, sensor_type, ch0..ch5, alchohol

Per user mapping: ch0..ch5 correspond to R, S, T, U, V, W respectively.

The file may include comment lines like "2nd reading" and blank rows.
We drop rows with any '-1.0' readings and non-numeric sensor values.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Tuple, Optional, Dict

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split


CHANNEL_MAP: Dict[str, str] = {
    "ch0": "R",
    "ch1": "S",
    "ch2": "T",
    "ch3": "U",
    "ch4": "V",
    "ch5": "W",
}


@dataclass
class RealDataConfig:
    csv_path: Path = Path("ayurvedic-ml-pipeline/data/real/data.csv")
    timestamp_col: str = "timestamp"
    sensor_type_col: str = "sensor_type"
    alcohol_col: str = "alchohol"  # spelling as in source file
    drop_negative_flag: bool = True
    test_size: float = 0.15
    val_size: float = 0.15
    random_state: int = 42


def _read_raw_csv(cfg: RealDataConfig) -> pd.DataFrame:
    df = pd.read_csv(cfg.csv_path, header=0, dtype=str, on_bad_lines="skip")

    # Remove obviously non-data rows (e.g., lines like "2nd reading", "new readings")
    df = df[df[cfg.timestamp_col].notna()]
    df = df[~df[cfg.timestamp_col].str.contains("reading", case=False, na=False)]

    # Coerce numeric columns
    numeric_cols = ["ch0", "ch1", "ch2", "ch3", "ch4", "ch5", cfg.alcohol_col]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Parse timestamp
    df[cfg.timestamp_col] = pd.to_datetime(df[cfg.timestamp_col], errors="coerce")
    df = df.dropna(subset=numeric_cols)

    # Drop rows with any -1 sentinel values
    if cfg.drop_negative_flag:
        mask_neg = (df[numeric_cols] == -1).any(axis=1) | (df[numeric_cols] == -1.0).any(axis=1)
        df = df[~mask_neg]

    # Ensure sensor type present
    if cfg.sensor_type_col in df.columns:
        df = df[df[cfg.sensor_type_col].notna()]

    # Sort by time if available
    if df[cfg.timestamp_col].notna().any():
        df = df.sort_values(cfg.timestamp_col).reset_index(drop=True)

    return df


def load_real_dataset(cfg: Optional[RealDataConfig] = None) -> pd.DataFrame:
    """Load and return a cleaned DataFrame with renamed channels to R..W and standardized columns.

    Returns columns:
    - timestamp, sensor_type, R..W, mq3_ppm
    """
    cfg = cfg or RealDataConfig()
    df = _read_raw_csv(cfg)

    # Rename channels ch0..ch5 -> R..W
    rename_map = {**CHANNEL_MAP, cfg.alcohol_col: "mq3_ppm"}
    df = df.rename(columns=rename_map)

    # Keep only expected columns
    keep_cols = [cfg.timestamp_col, cfg.sensor_type_col, "R", "S", "T", "U", "V", "W", "mq3_ppm"]
    df = df[[c for c in keep_cols if c in df.columns]].copy()

    # Add a simple monotonically increasing reading id
    df["Reading_ID"] = np.arange(1, len(df) + 1)

    return df


def train_val_test_split(
    df: pd.DataFrame,
    cfg: Optional[RealDataConfig] = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Split into train/val/test by random split preserving temporal order as much as possible.

    We first split off test, then split train into train/val. Stratification
    is skipped since labels are not included in the real CSV.
    """
    cfg = cfg or RealDataConfig()

    # Use index as order proxy (already time-sorted)
    idx = np.arange(len(df))
    idx_trainval, idx_test = train_test_split(
        idx, test_size=cfg.test_size, random_state=cfg.random_state, shuffle=True
    )

    # Further split train/val
    rel_val_size = cfg.val_size / (1.0 - cfg.test_size)
    idx_train, idx_val = train_test_split(
        idx_trainval, test_size=rel_val_size, random_state=cfg.random_state, shuffle=True
    )

    return df.iloc[idx_train].reset_index(drop=True), df.iloc[idx_val].reset_index(drop=True), df.iloc[idx_test].reset_index(drop=True)



