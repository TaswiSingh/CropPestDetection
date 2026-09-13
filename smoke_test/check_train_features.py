import pandas as pd

FILE = "smoke_test/train_features.parquet"

df = pd.read_parquet(FILE)

feature_cols = [c for c in df.columns if "__" in c]

print("\n===== TRAIN FEATURE CHECK =====")

print("Shape:", df.shape)
print("SampleIDs:", df["SampleID"].nunique())
print("Plants:", df["plant_id"].nunique())
print("ML features:", len(feature_cols))

print("\n===== HEAD-1 LABELS =====")
print(df["y_L1"].value_counts())

print("\n===== HEAD-2 LABELS =====")
print(df["y_L2"].value_counts(dropna=False))

print("\n===== TIMEPOINTS =====")
print(sorted(df["Time_h"].unique()))

print("\n===== TREATMENTS =====")
print(df["Treatment"].value_counts())

# Basic assertions
assert df.shape[0] == 1680
assert df.shape[1] == 83
assert df["SampleID"].nunique() == 1680
assert df["plant_id"].nunique() == 240
assert len(feature_cols) == 72

print("\n✅ TRAIN FEATURE CHECK PASSED")