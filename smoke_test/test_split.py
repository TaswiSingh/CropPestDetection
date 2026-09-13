import sys
import os

sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

import pandas as pd

from src.splits import (
    stratified_group_folds,
    assert_no_leakage
)

# Load validation features
df = pd.read_parquet(
    "smoke_test/validation_features.parquet"
)

print("Total rows:", len(df))
print("Total plants:", df["plant_id"].nunique())

# Create 5 plant-wise folds
folds = stratified_group_folds(df, n_splits=5)

print("\nChecking folds...\n")

for fold_number, (train_idx, test_idx) in enumerate(folds, start=1):

    train_plants = set(
        df.iloc[train_idx]["plant_id"]
    )

    test_plants = set(
        df.iloc[test_idx]["plant_id"]
    )

    # Check for leakage
    assert_no_leakage(
        df,
        train_idx,
        test_idx
    )

    print(f"Fold {fold_number}")
    print("  Train plants:", len(train_plants))
    print("  Test plants :", len(test_plants))
    print("  Train rows  :", len(train_idx))
    print("  Test rows   :", len(test_idx))
    print("  Leakage     : NO")
    print()

print("PLANT-WISE SPLIT TEST PASSED!")