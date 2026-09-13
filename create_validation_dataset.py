import pandas as pd
import os

INPUT = r"E:\cn gate\Time series electronic nose responses from tomato (1)\Time series electronic nose responses from tomato\e_nose_thrips_60rep_per_treat_time.csv"

OUTPUT = "smoke_test/validation_dataset.csv"

TREATMENTS = [
    "Control",
    "Low",
    "Medium",
    "High",
    "Mechanical"
]

PLANTS_PER_TREATMENT = 10

# --------------------------------------------------
# Step 1: Find 10 plants from each treatment
# --------------------------------------------------

plants = {t: [] for t in TREATMENTS}

for chunk in pd.read_csv(
    INPUT,
    usecols=["SampleID", "Treatment", "Replicate"],
    chunksize=500_000
):

    unique = chunk.drop_duplicates(
        subset=["Treatment", "Replicate"]
    )

    for treatment in TREATMENTS:

        if len(plants[treatment]) >= PLANTS_PER_TREATMENT:
            continue

        rows = unique[
            unique["Treatment"] == treatment
        ]

        for _, row in rows.iterrows():

            replicate = row["Replicate"]

            if replicate not in plants[treatment]:
                plants[treatment].append(replicate)

            if len(plants[treatment]) >= PLANTS_PER_TREATMENT:
                break

# --------------------------------------------------
# Step 2: Create selected plant IDs
# --------------------------------------------------

selected_plants = []

for treatment in TREATMENTS:

    for replicate in plants[treatment]:

        plant_id = f"{treatment}_{replicate}"
        selected_plants.append(plant_id)

print("Selected plants:")
for treatment in TREATMENTS:
    print(treatment, ":", plants[treatment])

print("\nTotal plants:", len(selected_plants))

# --------------------------------------------------
# Step 3: Find all SampleIDs belonging to these plants
# --------------------------------------------------

selected_samples = set()

for chunk in pd.read_csv(
    INPUT,
    usecols=[
        "SampleID",
        "Treatment",
        "Replicate"
    ],
    chunksize=500_000
):

    chunk["plant_id"] = (
        chunk["Treatment"].astype(str)
        + "_"
        + chunk["Replicate"].astype(str)
    )

    matched = chunk[
        chunk["plant_id"].isin(selected_plants)
    ]

    selected_samples.update(
        matched["SampleID"].unique()
    )

print("\nSelected SampleIDs:", len(selected_samples))

# --------------------------------------------------
# Step 4: Extract complete raw data
# --------------------------------------------------

if os.path.exists(OUTPUT):
    os.remove(OUTPUT)

total_rows = 0

for chunk in pd.read_csv(
    INPUT,
    chunksize=500_000
):

    selected = chunk[
        chunk["SampleID"].isin(selected_samples)
    ]

    if not selected.empty:

        selected.to_csv(
            OUTPUT,
            mode="a",
            header=not os.path.exists(OUTPUT),
            index=False
        )

        total_rows += len(selected)

print("\nValidation dataset created!")
print("File:", OUTPUT)
print("Rows:", total_rows)

# --------------------------------------------------
# Step 5: Final verification
# --------------------------------------------------

df = pd.read_csv(
    OUTPUT,
    usecols=[
        "SampleID",
        "Treatment",
        "Time_h",
        "Replicate"
    ]
)

print("Unique SampleIDs:", df["SampleID"].nunique())
print("Unique plants:", df["Replicate"].nunique())

print("\nSamples per treatment:")
print(
    df[["SampleID", "Treatment"]]
    .drop_duplicates()["Treatment"]
    .value_counts()
    .sort_index()
)