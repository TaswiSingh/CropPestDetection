"""Phase-aware features: per-SampleID R0 -> dR/R0 -> acquisition + recovery stats.

One output row per SampleID (~2100 rows). Array-ratio copies make signatures
concentration/distance invariant for field deployment.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from .ingestion import SENSORS, TREATMENT_TO_L1

EPS = 1e-6
ACQ_QUERIES = {"slope_lo": 0.10, "slope_hi": 0.30, "steady_frac": 0.20, "rec_tail": 10}


def compute_R0(sdf: pd.DataFrame) -> tuple[pd.Series, bool]:
    base = sdf[sdf["Phase"] == "baseline"]
    fallback = len(base) == 0
    src = sdf if fallback else base
    return src[SENSORS].median(), fallback


def dr_over_r0(sdf: pd.DataFrame, r0: pd.Series) -> pd.DataFrame:
    return (sdf[SENSORS] - r0) / (r0.abs() + EPS)


def _slope(t: np.ndarray, y: np.ndarray) -> float:
    if len(t) < 3 or np.ptp(t) < 1e-9:
        return 0.0
    return float(np.polyfit(t, y, 1)[0])


def acq_stats(t: np.ndarray, y: np.ndarray) -> dict:
    n = len(y)
    lo, hi = int(n * ACQ_QUERIES["slope_lo"]), int(n * ACQ_QUERIES["slope_hi"])
    tail = max(1, int(n * ACQ_QUERIES["steady_frac"]))
    return {
        "peak": float(np.max(y)),
        "auc": float(np.trapezoid(y, t)),
        "slope": _slope(t[lo:hi], y[lo:hi]),
        "steady": float(np.mean(y[-tail:])),
    }


def process_sample(sdf: pd.DataFrame) -> dict:
    from .ingestion import validate_sample
    sdf = sdf.sort_values("Time_s").reset_index(drop=True)
    r0, fallback = compute_R0(sdf)
    dr = dr_over_r0(sdf, r0)
    acq = sdf["Phase"] == "acquisition"
    rec = sdf["Phase"] == "recovery"
    t_acq = sdf.loc[acq, "Time_s"].to_numpy()
    row: dict = {
        "SampleID": sdf["SampleID"].iloc[0],
        "Treatment": sdf["Treatment"].iloc[0],
        "Time_h": int(sdf["Time_h"].iloc[0]),
        "Replicate": int(sdf["Replicate"].iloc[0]),
        "plant_id": f"{sdf['Treatment'].iloc[0]}_{sdf['Replicate'].iloc[0]}",
        "R0_fallback": int(fallback),
        "qa_issues": ";".join(validate_sample(sdf)),
    }
    raw = {}
    for s in SENSORS:
        for k, v in acq_stats(t_acq, dr.loc[acq, s].to_numpy()).items():
            raw[(s, k)] = v
            row[f"{s}__{k}"] = v
    for kind in ("peak", "auc", "slope", "steady"):
        tot = sum(abs(raw[(s, kind)]) for s in SENSORS) + EPS
        for s in SENSORS:
            row[f"{s}__{kind}_ratio"] = raw[(s, kind)] / tot
    if rec.sum() >= ACQ_QUERIES["rec_tail"]:
        tail = dr.loc[rec, :].to_numpy()[-ACQ_QUERIES["rec_tail"]:, :]
        row["recovery_return"] = float(np.mean(np.abs(tail)))
        t_rec = sdf.loc[rec, "Time_s"].to_numpy()
        row["recovery_auc"] = float(np.mean(np.abs([np.trapezoid(dr.loc[rec, s].to_numpy(), t_rec) for s in SENSORS])))
    else:
        row["recovery_return"] = np.nan
        row["recovery_auc"] = float("nan")
    trt = row["Treatment"]
    row["y_L1"] = TREATMENT_TO_L1.get(trt, "Pest")
    row["y_L2"] = trt if trt in ("Low", "Medium", "High") else "NA"
    return row


def build_features_csv(input_csv: str, output_parquet: str, chunksize: int = 500_000) -> str:
    from .ingestion import iter_samples_csv
    import pyarrow.parquet as pq, pyarrow as pa
    rows = []
    n = 0
    for _, sdf in iter_samples_csv(input_csv, chunksize):
        rows.append(process_sample(sdf))
        n += 1
    tbl = pa.Table.from_pylist(rows)
    pq.write_table(tbl, output_parquet)
    return f"wrote {n} sample rows -> {output_parquet}"
