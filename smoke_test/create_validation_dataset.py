import argparse, os, sys
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

parser = argparse.ArgumentParser()
parser.add_argument("--input", default="datasets/e_nose_thrips_60rep_per_treat_time.csv")
parser.add_argument("--output", default="smoke_test/validation_dataset.csv")
parser.add_argument("--plants_per_treatment", type=int, default=10)
args = parser.parse_args()

INPUT = args.input
OUTPUT = args.output
TREATMENTS = ["Control", "Low", "Medium", "High", "Mechanical"]
PLANTS_PER_TREATMENT = args.plants_per_treatment

plants = {t: [] for t in TREATMENTS}

for chunk in pd.read_csv(
    INPUT,
    usecols=["SampleID", "Treatment", "Replicate"],
    chunksize=500_000
):
    unique = chunk.drop_duplicates(subset=["Treatment", "Replicate"])
    for treatment in TREATMENTS:
        if len(plants[treatment]) >= PLANTS_PER_TREATMENT:
            continue
        rows = unique[unique["Treatment"] == treatment]
        for _, row in rows.iterrows():
            replicate = row["Replicate"]
            if replicate not in plants[treatment]:
                plants[treatment].append(replicate)
            if len(plants[treatment]) >= PLANTS_PER_TREATMENT:
                break

selected_plants = []
for treatment in TREATMENTS:
    for replicate in plants[treatment]:
        plant_id = f"{treatment}_{replicate}"
        selected_plants.append(plant_id)

print("Selected plants:", {t: len(v) for t, v in plants.items()})
print("Total plants:", len(selected_plants))

selected_samples = set()
for chunk in pd.read_csv(
    INPUT,
    usecols=["SampleID", "Treatment", "Replicate"],
    chunksize=500_000
):
    chunk["plant_id"] = (
        chunk["Treatment"].astype(str)
        + "_"
        + chunk["Replicate"].astype(str)
    )
    matched = chunk[chunk["plant_id"].isin(selected_plants)]
    selected_samples.update(matched["SampleID"].unique())

print("Selected SampleIDs:", len(selected_samples))

if os.path.exists(OUTPUT):
    os.remove(OUTPUT)

total_rows = 0
for chunk in pd.read_csv(INPUT, chunksize=500_000):
    selected = chunk[chunk["SampleID"].isin(selected_samples)]
    if not selected.empty:
        selected.to_csv(OUTPUT, mode="a", header=not os.path.exists(OUTPUT), index=False)
        total_rows += len(selected)

print(f"Validation dataset created! Rows: {total_rows}")

df = pd.read_csv(OUTPUT, usecols=["SampleID", "Treatment", "Time_h", "Replicate"])
print("Unique SampleIDs:", df["SampleID"].nunique())
print("Unique plants:", df["Replicate"].nunique())
print("\nSamples per treatment:")
print(
    df[["SampleID", "Treatment"]]
    .drop_duplicates()["Treatment"]
    .value_counts()
    .sort_index()
)
