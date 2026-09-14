"""One-time: derive synthesis constants from lab data (no runtime dependency)."""
import itertools, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import numpy as np
import pandas as pd
from src.ingestion import SENSORS, iter_samples_csv
from src.features import compute_R0, dr_over_r0

CSV = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "datasets", "e_nose_thrips_60rep_per_treat_time.csv")
groups = {}
r0_all = []
for _, sdf in itertools.islice(iter_samples_csv(CSV), 2100):
    trt, th = sdf.Treatment.iloc[0], int(sdf.Time_h.iloc[0])
    r0, _ = compute_R0(sdf)
    r0_all.append(r0)
    if th != 168:
        continue
    dr = dr_over_r0(sdf, r0)
    acq = sdf["Phase"] == "acquisition"
    tail = dr.loc[acq, :].to_numpy()[-240:, :]
    groups.setdefault(trt, []).append(tail.mean(0))
out = {"R0": pd.DataFrame(r0_all).median().round(5).to_dict(), "templates": {}}
for trt, arr in groups.items():
    out["templates"][trt] = dict(zip(SENSORS, np.median(np.stack(arr), 0).round(5).tolist()))
print(json.dumps(out, indent=2))
