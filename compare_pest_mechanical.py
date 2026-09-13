import pandas as pd

FEATURE_FILE = "smoke_test/validation_features.parquet"

df = pd.read_parquet(FEATURE_FILE)

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

wrong_mech = df[df["SampleID"].isin(wrong_ids)]

correct_mech = df[
    (df["y_L1"] == "Mechanical") &
    (~df["SampleID"].isin(wrong_ids))
]

pest = df[df["y_L1"] == "Pest"]

features = [
    "MiCS_NO2__auc",
    "MiCS_NO2__peak",
    "MiCS_NO2__steady",
    "MiCS_NH3__auc",
    "MiCS_NH3__peak",
    "MiCS_NH3__steady"
]

comparison = pd.DataFrame({
    "Wrong_Mechanical": wrong_mech[features].mean(),
    "Correct_Mechanical": correct_mech[features].mean(),
    "Pest": pest[features].mean()
})

print("\n===== SENSOR FEATURE COMPARISON =====")
print(comparison.to_string())

print("\n===== SAMPLE COUNTS =====")
print("Wrong Mechanical:", len(wrong_mech))
print("Correct Mechanical:", len(correct_mech))
print("Pest:", len(pest))