"""Universal ingestion: CSV-replay and live-IoT produce identical tidy frames.

Protocol (locked from data):
  baseline    0.0-29.9s    ~300 rows  clean-air R0
  acquisition 30.0-149.9s  ~1200 rows foliage exposure
  recovery    150.0-209.9s ~600 rows  purge
  total per SampleID ~2100 rows @0.1s; 2100 SampleIDs = 5 trt x 7 times x 60 reps
  plant_id = Treatment_Replicate (longitudinal: same plant over 7 Time_h)
"""
from __future__ import annotations
import pandas as pd

SENSORS = ["TGS2600", "TGS2602", "TGS822", "MQ3", "MQ135", "MQ138",
           "MiCS_NO2", "MiCS_NH3", "MiCS_CO"]
META = ["SampleID", "Time_s", "Phase", "Treatment", "Time_h", "Replicate"]
PHASES = ("baseline", "acquisition", "recovery")
EXPECTED_COUNTS = {"baseline": 300, "acquisition": 1200, "recovery": 600}

TREATMENTS = ("Control", "Low", "Medium", "High", "Mechanical")
TIME_H = (1, 3, 6, 12, 24, 48, 168)
TREATMENT_TO_L1 = {"Control": "Control", "Mechanical": "Mechanical"}
TREATMENT_TO_L2 = {t: t for t in ("Low", "Medium", "High")}


def make_plant_id(df: pd.DataFrame) -> pd.Series:
    return df["Treatment"].astype(str) + "_" + df["Replicate"].astype(str)


def make_labels(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["plant_id"] = make_plant_id(df)
    df["y_L1"] = df["Treatment"].map({
        "Control": "Control", "Mechanical": "Mechanical",
        "Low": "Pest", "Medium": "Pest", "High": "Pest"})
    df["y_L2"] = df["Treatment"].where(df["Treatment"].isin(["Low", "Medium", "High"]))
    return df


def validate_sample(sdf: pd.DataFrame, tol: int = 25) -> list[str]:
    issues = []
    phases = set(sdf["Phase"].unique())
    for p in PHASES:
        if p not in phases:
            issues.append(f"missing-phase:{p}")
    for p, exp in EXPECTED_COUNTS.items():
        n = int((sdf["Phase"] == p).sum())
        if p in phases and abs(n - exp) > tol:
            issues.append(f"count-drift:{p}={n}!={exp}")
    if not sdf["Time_s"].is_monotonic_increasing:
        issues.append("time-not-monotonic")
    if sdf[SENSORS].isna().any().any():
        issues.append("has-nans")
    return issues


def iter_samples_csv(path: str, chunksize: int = 500_000):
    """Yield (SampleID, sample_df) sorted by Time_s, safe across chunk borders."""
    buf = {}
    for chunk in pd.read_csv(path, chunksize=chunksize):
        for sid, g in chunk.groupby("SampleID"):
            buf.setdefault(sid, []).append(g)
        while len(buf) > 3:
            done = [s for s in buf if buf[s][0]["SampleID"].iloc[0] != chunk["SampleID"].iloc[-1]]
            if not done:
                break
            for sid in sorted(done)[:-1]:
                sdf = pd.concat(buf.pop(sid)).sort_values("Time_s").reset_index(drop=True)
                yield sid, sdf
    for sid in sorted(buf):
        yield sid, pd.concat(buf[sid]).sort_values("Time_s").reset_index(drop=True)


class UniversalSensorLoader:
    """Same output schema from CSV file or live sensor dict (IoT decoupling)."""

    columns = META + SENSORS

    def from_csv_sample(self, sdf: pd.DataFrame) -> pd.DataFrame:
        sdf = sdf.sort_values("Time_s").reset_index(drop=True)
        return make_labels(sdf[self.columns])

    def from_live(self, readings: dict, meta: dict) -> pd.DataFrame:
        rows = []
        for i, t in enumerate(readings["Time_s"]):
            r = {c: readings[c][i] for c in SENSORS}
            r.update({"Time_s": t,
                      "Phase": readings.get("Phase", ["acquisition"] * len(readings["Time_s"]))[i]
                      if isinstance(readings.get("Phase"), list) else readings.get("Phase", "acquisition"),
                      "SampleID": meta.get("SampleID", "LIVE"),
                      "Treatment": meta.get("Treatment", "Unknown"),
                      "Time_h": meta.get("Time_h", -1),
                      "Replicate": meta.get("Replicate", -1)})
            rows.append(r)
        return self.from_csv_sample(pd.DataFrame(rows, columns=self.columns))
