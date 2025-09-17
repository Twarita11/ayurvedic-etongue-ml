import json
from pathlib import Path

import pandas as pd

from src.data.real_loader import load_real_dataset, train_val_test_split as real_split
from src.data.synthetic_loader import load_synthetic_dataset, train_val_test_split as synth_split
from src.models.training import (
    train_dilution_regressor, train_effectiveness_regressor, train_medicine_classifier,
    train_taste_multiregressor, evaluate_regression, evaluate_classification, save_model
)


def main():
    out_dir = Path('ayurvedic-ml-pipeline/models')
    metrics_real = Path('ayurvedic-ml-pipeline/docs/metrics_real.json')
    metrics_synth = Path('ayurvedic-ml-pipeline/docs/metrics_synth.json')
    metrics_real.parent.mkdir(parents=True, exist_ok=True)

    df = load_real_dataset()
    # If real dataset lacks labels, fallback to synthetic labeled data
    has_any_label = any(c in df.columns for c in ['Dilution_Percent','Effectiveness_Score','Medicine_Name','taste_sweet'])
    if not has_any_label:
        df = load_synthetic_dataset()
        train_df, val_df, test_df = synth_split(df)
        metrics_path = metrics_synth
    else:
        train_df, val_df, test_df = real_split(df)
        metrics_path = metrics_real

    metrics = {}

    if 'Dilution_Percent' in df.columns and not df['Dilution_Percent'].isna().all():
        m = train_dilution_regressor(train_df)
        save_model(m, out_dir / 'dilution_model.pkl')
        metrics['dilution'] = {
            'val': evaluate_regression(m, val_df, 'Dilution_Percent'),
        }

    if 'Effectiveness_Score' in df.columns and not df['Effectiveness_Score'].isna().all():
        m = train_effectiveness_regressor(train_df)
        save_model(m, out_dir / 'effectiveness_model.pkl')
        metrics['effectiveness'] = {
            'val': evaluate_regression(m, val_df, 'Effectiveness_Score'),
        }

    if 'Medicine_Name' in df.columns and not df['Medicine_Name'].isna().all():
        m = train_medicine_classifier(train_df)
        save_model(m, out_dir / 'medicine_model.pkl')
        metrics['medicine'] = {
            'val': evaluate_classification(m, val_df, 'Medicine_Name'),
        }

    taste_cols = [c for c in ['taste_sweet','taste_sour','taste_salty','taste_bitter','taste_pungent','taste_astringent'] if c in df.columns]
    if taste_cols:
        m = train_taste_multiregressor(train_df, taste_cols)
        save_model(m, out_dir / 'taste_multireg_model.pkl')
        metrics['taste'] = {
            'val': {c: evaluate_regression(m, val_df, c) for c in taste_cols}
        }

    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2)
    print('Saved metrics to', metrics_path)


if __name__ == '__main__':
    main()


