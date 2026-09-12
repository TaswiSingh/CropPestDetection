"""Export deployment artifacts: no scaler for trees (watch-out #2).

Trains winning Head-1 + Head-2 XGB on full data with fixed params, saves:
  models/head1_xgb.json, models/head2_xgb.json, models/feature_list.json,
  models/label_classes.json, reports/final_metrics.json
OOF metrics in reports/ remain the honest performance claim (not refit acc).
"""
from __future__ import annotations
import json, os, sys
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.train_baseline import get_features

HEAD1_PARAMS = {"n_estimators": 800, "max_depth": 4, "learning_rate": 0.05,
                "subsample": 0.8, "colsample_bytree": 0.8, "reg_lambda": 1.0,
                "n_jobs": -1, "eval_metric": "mlogloss", "random_state": 42}
HEAD2_PARAMS = {"n_estimators": 600, "max_depth": 4, "learning_rate": 0.05,
                "subsample": 0.8, "colsample_bytree": 0.8,
                "n_jobs": -1, "eval_metric": "mlogloss", "random_state": 42}


def main(feat_path="processed/features.parquet", model_dir="models"):
    from sklearn.preprocessing import LabelEncoder
    from xgboost import XGBClassifier
    os.makedirs(model_dir, exist_ok=True)
    feat = pd.read_parquet(feat_path)
    Xcols = get_features(feat)

    le1 = LabelEncoder().fit(feat["y_L1"].to_numpy())
    h1 = XGBClassifier(**HEAD1_PARAMS)
    h1.fit(feat[Xcols].to_numpy(), le1.transform(feat["y_L1"].to_numpy()))
    h1.save_model(os.path.join(model_dir, "head1_xgb.json"))

    pest = feat[feat["y_L2"] != "NA"].reset_index(drop=True)
    le2 = LabelEncoder().fit(pest["y_L2"].to_numpy())
    h2 = XGBClassifier(**HEAD2_PARAMS)
    h2.fit(pest[Xcols].to_numpy(), le2.transform(pest["y_L2"].to_numpy()))
    h2.save_model(os.path.join(model_dir, "head2_xgb.json"))

    imp = sorted(zip(Xcols, h1.feature_importances_), key=lambda t: -t[1])[:15]
    with open(os.path.join(model_dir, "feature_list.json"), "w") as f:
        json.dump(Xcols, f, indent=2)
    with open(os.path.join(model_dir, "label_classes.json"), "w") as f:
        json.dump({"y_L1": le1.classes_.tolist(), "y_L2": le2.classes_.tolist(),
                   "head1_params": HEAD1_PARAMS, "head2_params": HEAD2_PARAMS,
                   "top15_head1_importance": [[k, float(v)] for k, v in imp]}, f, indent=2)
    print("saved to", model_dir, "| top5:", [k for k, _ in imp[:5]])


if __name__ == "__main__":
    main()
