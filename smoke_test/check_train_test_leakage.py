import pandas as pd

TRAIN = "smoke_test/train_raw.csv"
TEST = "smoke_test/test_raw.csv"

print("Reading train metadata...")
train = pd.read_csv(
    TRAIN,
    usecols=["Treatment", "Replicate", "SampleID"]
)

print("Reading test metadata...")
test = pd.read_csv(
    TEST,
    usecols=["Treatment", "Replicate", "SampleID"]
)

# Same definition of plant as project
train["plant_id"] = (
    train["Treatment"].astype(str)
    + "_"
    + train["Replicate"].astype(str)
)

test["plant_id"] = (
    test["Treatment"].astype(str)
    + "_"
    + test["Replicate"].astype(str)
)

train_plants = set(train["plant_id"])
test_plants = set(test["plant_id"])

overlap = train_plants & test_plants

print("\n===== LEAKAGE CHECK =====")

print("Train plants:", len(train_plants))
print("Test plants:", len(test_plants))
print("Overlapping plants:", len(overlap))

if len(overlap) == 0:
    print("\n✅ NO PLANT LEAKAGE")
else:
    print("\n❌ LEAKAGE FOUND")
    print("Overlapping plants:")
    print(overlap)

print("\n===== SAMPLE CHECK =====")

train_samples = set(train["SampleID"])
test_samples = set(test["SampleID"])

sample_overlap = train_samples & test_samples

print("Train SampleIDs:", len(train_samples))
print("Test SampleIDs:", len(test_samples))
print("Overlapping SampleIDs:", len(sample_overlap))

if len(sample_overlap) == 0:
    print("✅ NO SAMPLE LEAKAGE")
else:
    print("❌ SAMPLE LEAKAGE FOUND")