import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from xgboost import XGBClassifier
from src.train_baseline import run_cv


FEATURE_FILE = "smoke_test/validation_features.parquet"

df = pd.read_parquet(FEATURE_FILE)


# Same XGBoost model as friend's xgb_default
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


# Plant-wise 5-fold CV
summaries, predictions = run_cv(
    df,
    make_xgb,
    False,
    encode_labels=True
)


# -------------------------------
# Mechanical samples
# -------------------------------

mech = df[df["y_L1"] == "Mechanical"].copy()

mech["prediction"] = predictions[mech.index]


print("\n===== MECHANICAL PREDICTIONS =====")

print(
    mech[
        ["SampleID", "plant_id", "Time_h", "prediction"]
    ].to_string(index=False)
)


# -------------------------------
# Mechanical -> Pest mistakes
# -------------------------------

mistakes = mech[mech["prediction"] == "Pest"]


print("\n===== MECHANICAL -> PEST MISTAKES =====")

if len(mistakes) == 0:
    print("No Mechanical -> Pest mistakes!")

else:
    print(
        mistakes[
            ["SampleID", "plant_id", "Time_h"]
        ].to_string(index=False)
    )


# -------------------------------
# Summary
# -------------------------------

print("\n===== SUMMARY =====")

print("Total Mechanical samples:", len(mech))
print("Mechanical predicted as Pest:", len(mistakes))

print(
    "Mechanical -> Pest rate:",
    len(mistakes) / len(mech)
)


# -------------------------------
# Mistakes by time
# -------------------------------

print("\n===== MISTAKES BY TIME =====")

time_table = (
    mech.groupby("Time_h")
    .agg(
        total_mechanical=("SampleID", "count"),
        predicted_pest=("prediction", lambda x: (x == "Pest").sum())
    )
)

time_table["error_rate"] = (
    time_table["predicted_pest"]
    / time_table["total_mechanical"]
)

print(time_table)