import pandas as pd
import os

INPUT = r"E:\cn gate\Time series electronic nose responses from tomato (1)\Time series electronic nose responses from tomato\e_nose_thrips_60rep_per_treat_time.csv"

TRAIN_OUTPUT = "smoke_test/train_raw.csv"
TEST_OUTPUT = "smoke_test/test_raw.csv"

# --------------------------------------------------
# STEP 1: Read only metadata
# --------------------------------------------------

print("Reading plant information...")

meta = pd.read_csv(
    INPUT,
    usecols=["SampleID", "Treatment", "Time_h", "Replicate"]
)

# One plant = Treatment + Replicate
meta["plant_id"] = (
    meta["Treatment"].astype(str)
    + "_"
    + meta["Replicate"].astype(str)
)

plants = meta[["plant_id", "Treatment"]].drop_duplicates()

print("\nTotal plants:", len(plants))

# --------------------------------------------------
# STEP 2: Select 20% plants for final test
# --------------------------------------------------

# Fixed random seed = same split every time
test_plants = (
    plants
    .groupby("Treatment", group_keys=False)
    .sample(frac=0.20, random_state=42)
)

test_plant_ids = set(test_plants["plant_id"])

train_plants = plants[
    ~plants["plant_id"].isin(test_plant_ids)
]

print("Training plants:", len(train_plants))
print("Testing plants:", len(test_plants))

print("\nPlants per treatment:")

print(
    plants.groupby("Treatment").size()
)

print("\nTest plants per treatment:")

print(
    test_plants.groupby("Treatment").size()
)

# --------------------------------------------------
# STEP 3: Get SampleIDs belonging to each plant
# --------------------------------------------------

test_sample_ids = set(
    meta.loc[
        meta["plant_id"].isin(test_plant_ids),
        "SampleID"
    ]
)

train_sample_ids = set(
    meta.loc[
        ~meta["plant_id"].isin(test_plant_ids),
        "SampleID"
    ]
)

print("\nTraining SampleIDs:", len(train_sample_ids))
print("Testing SampleIDs:", len(test_sample_ids))

# --------------------------------------------------
# STEP 4: Read raw CSV in chunks
# --------------------------------------------------

print("\nCreating train/test CSV files...")

if os.path.exists(TRAIN_OUTPUT):
    os.remove(TRAIN_OUTPUT)

if os.path.exists(TEST_OUTPUT):
    os.remove(TEST_OUTPUT)

train_header = True
test_header = True

for chunk in pd.read_csv(INPUT, chunksize=500_000):

    train_chunk = chunk[
        chunk["SampleID"].isin(train_sample_ids)
    ]

    test_chunk = chunk[
        chunk["SampleID"].isin(test_sample_ids)
    ]

    if len(train_chunk) > 0:
        train_chunk.to_csv(
            TRAIN_OUTPUT,
            mode="a",
            index=False,
            header=train_header
        )
        train_header = False

    if len(test_chunk) > 0:
        test_chunk.to_csv(
            TEST_OUTPUT,
            mode="a",
            index=False,
            header=test_header
        )
        test_header = False

print("\n===== DONE =====")
print("Train file:", TRAIN_OUTPUT)
print("Test file:", TEST_OUTPUT)