"""Deterministic IPM advisory: model prediction -> farmer action. No ML training here."""
import csv

def advise(pred_L1: str, pred_L2: str | None, kb_path: str = "advisory/kb.csv") -> str:
    key = pred_L2 if pred_L1 == "Pest" and pred_L2 else pred_L1
    with open(kb_path) as f:
        for row in csv.DictReader(f):
            if row.get("pest_or_stage") == key:
                return row.get("advisory", "")
    return f"No advisory entry for {key}; consult extension officer."
