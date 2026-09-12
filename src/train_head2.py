"""Head-2 severity: Low / Medium / High on pest-only rows.

Same plant-grouped folds restricted to pest plants. Expect weakness at 1h
(watch-out #3): success = Head-1 catches pest early, Head-2 resolves later.
"""
from __future__ import annotations
import argparse, json, os, sys
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.splits import stratified_group_folds, assert_no_leakage

TARGET = "y_L2"
TIMES = (1, 3, 6, 12, 24, 48, 168)


def get_features(feat: pd.DataFrame) -> list[str]:
    return [c for c in feat.columns if "__" in c]


def main(feat_path="processed/features.parquet", out="reports/head2.json"):
    from sklearn.preprocessing import LabelEncoder
    from sklearn.metrics import confusion_matrix
    from xgboost import XGBClassifier

    feat = pd.read_parquet(feat_path)
    pest = feat[feat[TARGET] != "NA"].reset_index(drop=True)
    Xcols = get_features(pest)
    le = LabelEncoder().fit(pest[TARGET].to_numpy())
    y = le.transform(pest[TARGET].to_numpy())
    th = pest["Time_h"].to_numpy()

    folds = stratified_group_folds(pest, n_splits=5, seed=42)
    per_time, cms, accs = {t: [] for t in TIMES}, [], []
    for tr, te in folds:
        assert_no_leakage(pest, tr, te)
        m = XGBClassifier(n_estimators=600, max_depth=4, learning_rate=0.05,
                          subsample=0.8, colsample_bytree=0.8,
                          n_jobs=-1, eval_metric="mlogloss", random_state=42)
        m.fit(pest.iloc[tr][Xcols].to_numpy(), y[tr])
        p = m.predict(pest.iloc[te][Xcols].to_numpy())
        accs.append(float((p == y[te]).mean()))
        cms.append(confusion_matrix(y[te], p, labels=list(range(len(le.classes_)))).tolist())
        for t in TIMES:
            msk = th[te] == t
            if msk.sum():
                per_time[t].append(float((p[msk] == y[te][msk]).mean()))
    res = {"classes": le.classes_.tolist(), "mean_acc": float(np.mean(accs)),
           "std_acc": float(np.std(accs)),
           "per_time_mean_acc": {str(t): float(np.mean(v)) for t, v in per_time.items()},
           "confusions": cms}
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    with open(out, "w") as f:
        json.dump(res, f, indent=2)
    print(f"Head-2 acc={res['mean_acc']:.3f}±{res['std_acc']:.3f} per_time={res['per_time_mean_acc']}")
    return res


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--features", default="processed/features.parquet")
    ap.add_argument("--out", default="reports/head2.json")
    a = ap.parse_args()
    main(a.features, a.out)
