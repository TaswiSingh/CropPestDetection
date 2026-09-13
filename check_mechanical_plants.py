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

wrong = df[df["SampleID"].isin(wrong_ids)]

print("\n===== WRONG PREDICTIONS BY PLANT =====")

plant_summary = (
    wrong.groupby("plant_id")
    .agg(
        wrong_count=("SampleID", "count"),
        wrong_times=("Time_h", lambda x: list(x))
    )
    .sort_values("wrong_count", ascending=False)
)

print(plant_summary.to_string())

print("\n===== WRONG PREDICTIONS BY TIME =====")

time_summary = (
    wrong.groupby("Time_h")
    .size()
    .sort_index()
)

print(time_summary)