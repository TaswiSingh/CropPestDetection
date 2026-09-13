import pandas as pd

FEATURE_FILE = "smoke_test/validation_features.parquet"

df = pd.read_parquet(FEATURE_FILE)

# These are the 8 samples our previous diagnostic found
wrong_ids = [
    "S00247",
    "S00250",
    "S00541",
    "S00545",
    "S00844",
    "S00845",
    "S00847",
    "S01144"
]

wrong = df[df["SampleID"].isin(wrong_ids)].copy()

# All correctly classified Mechanical samples
# (for now, we use the known prediction list from the diagnostic)
correct_ids = [
    sid for sid in df[df["y_L1"] == "Mechanical"]["SampleID"]
    if sid not in wrong_ids
]

correct = df[df["SampleID"].isin(correct_ids)].copy()

feature_cols = [c for c in df.columns if "__" in c]

print("\n===== WRONG MECHANICAL SAMPLES =====")
print(
    wrong[
        ["SampleID", "plant_id", "Time_h"]
    ].to_string(index=False)
)

print("\n===== FEATURE COMPARISON =====")

comparison = pd.DataFrame({
    "wrong_mean": wrong[feature_cols].mean(),
    "correct_mean": correct[feature_cols].mean()
})

comparison["absolute_difference"] = (
    comparison["wrong_mean"] - comparison["correct_mean"]
).abs()

comparison = comparison.sort_values(
    "absolute_difference",
    ascending=False
)

print("\nTop 15 features where WRONG and CORRECT Mechanical differ most:\n")

print(comparison.head(15).to_string())