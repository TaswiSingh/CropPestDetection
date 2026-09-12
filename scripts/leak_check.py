import itertools, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd
from src.ingestion import SENSORS, iter_samples_csv

rows = []
for sid, sdf in itertools.islice(
        iter_samples_csv("datasets/e_nose_thrips_60rep_per_treat_time.csv"), 2100):
    base = sdf[sdf.Phase == "baseline"]
    r = {"plant_id": f"{sdf.Treatment.iloc[0]}_{sdf.Replicate.iloc[0]}",
         "Treatment": sdf.Treatment.iloc[0],
         "Time_h": int(sdf.Time_h.iloc[0])}
    for s in SENSORS:
        r["R0_" + s] = base[s].median()
    rows.append(r)
r0 = pd.DataFrame(rows)
print("R0 means by Treatment:")
print(r0.groupby("Treatment")[[c for c in r0.columns if c.startswith("R0_")]].mean().T.round(4).to_string())
print()
print("R0 std by Treatment:")
print(r0.groupby("Treatment")[[c for c in r0.columns if c.startswith("R0_")]].std().T.round(4).to_string())
