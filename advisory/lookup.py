"""Deterministic IPM advisory: model prediction -> farmer action. No ML training here."""
import csv, os

_KB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "advisory", "kb.csv")
_KB = {}
with open(_KB_PATH) as f:
    for row in csv.DictReader(f):
        _KB[row["pest_or_stage"]] = row["advisory"]

def advise(pred_L1: str, pred_L2: str | None, kb_path: str = _KB_PATH) -> str:
    key = pred_L2 if pred_L1 == "Pest" and pred_L2 else pred_L1
    return _KB.get(key, f"No advisory entry for {key}; consult extension officer.")
