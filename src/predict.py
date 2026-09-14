"""Live inference: raw sensor cycle -> Head-1 -> Head-2 -> IPM advisory.

RPi path: collect 30s baseline + 120s acquisition + 60s recovery @10Hz,
pack into readings dict, call predict_live(). No scaler (trees are
scale-invariant); feature order pinned by models/feature_list.json.
"""
from __future__ import annotations
import argparse, json, os, sys
import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from src.ingestion import UniversalSensorLoader, SENSORS
from src.features import process_sample
from advisory.lookup import advise


class Predictor:
    def __init__(self, model_dir=os.path.join(ROOT, "models"),
                 kb_path=os.path.join(ROOT, "advisory", "kb.csv")):
        from xgboost import XGBClassifier
        with open(os.path.join(model_dir, "feature_list.json")) as f:
            self.features = json.load(f)
        with open(os.path.join(model_dir, "label_classes.json")) as f:
            lc = json.load(f)
        self.l1, self.l2 = lc["y_L1"], lc["y_L2"]
        self.h1 = XGBClassifier()
        self.h1.load_model(os.path.join(model_dir, "head1_xgb.json"))
        self.h2 = XGBClassifier()
        self.h2.load_model(os.path.join(model_dir, "head2_xgb.json"))
        self.kb_path = kb_path
        self.loader = UniversalSensorLoader()

    def predict_tidy(self, sdf: pd.DataFrame) -> dict:
        row = process_sample(self.loader.from_csv_sample(sdf))
        x = pd.DataFrame([row]).reindex(columns=self.features).to_numpy()
        p1 = self.l1[int(self.h1.predict(x)[0])]
        p2 = self.l2[int(self.h2.predict(x)[0])] if p1 == "Pest" else None
        proba = self.h1.predict_proba(x)[0]
        confidence = float(proba.max())
        return {"SampleID": row["SampleID"], "pred_L1": p1, "pred_L2": p2,
                "advisory": advise(p1, p2, self.kb_path),
                "qa_issues": row["qa_issues"], "R0_fallback": row["R0_fallback"],
                "confidence": confidence}

    def predict_live(self, readings: dict, meta: dict | None = None) -> dict:
        return self.predict_tidy(self.loader.from_live(readings, meta or {}))

    def predict_csv_sample(self, csv_path: str, sample_id: str) -> dict:
        from src.ingestion import iter_samples_csv
        for _, sdf in iter_samples_csv(csv_path):
            if sdf["SampleID"].iloc[0] == sample_id:
                return self.predict_tidy(sdf)
        raise ValueError(f"{sample_id} not found in {csv_path}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default=os.path.join(ROOT, "datasets",
                    "e_nose_thrips_60rep_per_treat_time.csv"))
    ap.add_argument("--sample", default="S00001")
    a = ap.parse_args()
    print(json.dumps(Predictor().predict_csv_sample(a.csv, a.sample), indent=2))
