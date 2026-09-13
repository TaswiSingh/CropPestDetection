import pandas as pd
import os

INPUT = r"E:\cn gate\Time series electronic nose responses from tomato (1)\Time series electronic nose responses from tomato\e_nose_thrips_60rep_per_treat_time.csv"

OUTPUT = "smoke_test/smoke_test.csv"

SAMPLE_IDS = [
    "S00001",  # Control
    "S00061",  # Low
    "S00121",  # Medium
    "S00181",  # High
    "S00241",  # Mechanical
]

if os.path.exists(OUTPUT):
    os.remove(OUTPUT)

for chunk in pd.read_csv(INPUT, chunksize=500_000):

    selected = chunk[chunk["SampleID"].isin(SAMPLE_IDS)]

    if not selected.empty:
        selected.to_csv(
            OUTPUT,
            mode="a",
            header=not os.path.exists(OUTPUT),
            index=False
        )

print("Smoke-test dataset created!")

df = pd.read_csv(OUTPUT)

print("Rows:", len(df))
print("SampleIDs:", df["SampleID"].nunique())

print("\nTreatment distribution:")
print(
    df[["SampleID", "Treatment"]]
    .drop_duplicates()
    .sort_values("SampleID")
    .to_string(index=False)
)

print("\nRows per SampleID:")
print(df["SampleID"].value_counts().sort_index())