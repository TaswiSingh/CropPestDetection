import sys
import os

# Project root ko Python path mein add karo
sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

import pandas as pd
from xgboost import XGBClassifier

from src.train_baseline import run_cv, agg


# Load our 50-plant validation dataset
df = pd.read_parquet(
    "smoke_test/validation_features.parquet"
)


def make_xgb():

    return XGBClassifier(
        n_estimators=600,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=1.0,
        n_jobs=-1,
        eval_metric="mlogloss",
        random_state=42
    )

print("Starting 5-fold XGBoost validation...")

summaries, predictions = run_cv(
    df,
    make_xgb,
    use_scaler=False,
    encode_labels=True
)

results = agg(summaries)

print("\n===== RESULTS =====")

print(
    "Early Pest Recall:",
    results["mean_early_recall"]
)

print(
    "Early Recall Std:",
    results["std_early_recall"]
)

print(
    "Mechanical -> Pest:",
    results["mean_mech_to_pest"]
)

print(
    "\nPer-time Pest Recall:"
)

for time, score in results["per_time_mean"].items():
    print(f"{time}h : {score:.3f}")

print("\nValidation completed successfully!")