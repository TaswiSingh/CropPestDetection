"""Head-1 baseline: Control / Mechanical / Pest. CPU-only, plant-grouped folds.

Scaler ON for LogReg only (watch-out #2); trees skip it. Optuna objective =
mean early (1h-6h) Pest recall with Time_h masking (watch-out #1).
"""
from __future__ import annotations
import argparse, json, os, sys
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.splits import stratified_group_folds, assert_no_leakage, N_SPLITS
from src.evaluate import summarize_fold

FEATURE_SUB = "__"
TARGET = "y_L1"

LABELS = ["Control", "Mechanical", "Pest"]


def get_features(feat: pd.DataFrame) -> list[str]:
    return [c for c in feat.columns if FEATURE_SUB in c]


def run_cv(feat: pd.DataFrame, make_model, use_scaler: bool, seed=42,
           encode_labels: bool = False):
    from sklearn.preprocessing import StandardScaler, LabelEncoder
    folds = stratified_group_folds(feat, n_splits=N_SPLITS, seed=seed)
    Xcols = get_features(feat)
    y_raw = feat[TARGET].to_numpy()
    le = LabelEncoder().fit(y_raw) if encode_labels else None
    y = le.transform(y_raw) if le else y_raw
    th = feat["Time_h"].to_numpy()
    summaries, preds = [], np.empty(len(feat), dtype=object)
    for tr, te in folds:
        assert_no_leakage(feat, tr, te)
        Xa, Xb = feat.iloc[tr][Xcols].to_numpy(), feat.iloc[te][Xcols].to_numpy()
        if use_scaler:
            sc = StandardScaler().fit(Xa)
            Xa, Xb = sc.transform(Xa), sc.transform(Xb)
        m = make_model()
        m.fit(Xa, y[tr])
        p = m.predict(Xb)
        if le:
            p = le.inverse_transform(p)
        preds[te] = p
        yt = le.inverse_transform(y[te]) if le else y[te]
        summaries.append(summarize_fold(yt, p, th[te]))
    return summaries, preds


def agg(summaries: list[dict]) -> dict:
    er = np.array([s["early_recall_1h6h"] for s in summaries])
    mp = np.array([s["mech_to_pest"] for s in summaries])
    pt = {t: float(np.nanmean([s["per_time"][t] for s in summaries])) for t in (1, 3, 6, 12, 24, 48, 168)}
    return {"mean_early_recall": float(er.mean()), "std_early_recall": float(er.std()),
            "mean_mech_to_pest": float(np.nanmean(mp)), "per_time_mean": pt,
            "folds": summaries}


def main(feat_path="processed/features.parquet", trials=100, out="reports/baseline_head1.json"):
    feat = pd.read_parquet(feat_path)
    from sklearn.dummy import DummyClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from xgboost import XGBClassifier

    results: dict = {}
    s, _ = run_cv(feat, lambda: DummyClassifier(strategy="stratified", random_state=42), False)
    results["dummy"] = agg(s)
    s, _ = run_cv(feat, lambda: LogisticRegression(max_iter=2000), True)
    results["logreg"] = agg(s)
    s, _ = run_cv(feat, lambda: RandomForestClassifier(n_estimators=400, n_jobs=-1, random_state=42), False)
    results["rf"] = agg(s)
    s, _ = run_cv(feat, lambda: XGBClassifier(n_estimators=600, max_depth=4, learning_rate=0.05,
                                              subsample=0.8, colsample_bytree=0.8,
                                              reg_lambda=1.0, n_jobs=-1,
                                              eval_metric="mlogloss", random_state=42), False,
                   encode_labels=True)
    results["xgb_default"] = agg(s)

    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    from sklearn.preprocessing import LabelEncoder
    Xcols = get_features(feat)
    le_opt = LabelEncoder().fit(feat[TARGET].to_numpy())
    y = le_opt.transform(feat[TARGET].to_numpy())
    y_str = feat[TARGET].to_numpy()
    th = feat["Time_h"].to_numpy()
    X = feat[Xcols].to_numpy()

    def objective(trial):
        p = {"max_depth": trial.suggest_int("max_depth", 3, 6),
             "learning_rate": trial.suggest_float("learning_rate", 0.02, 0.2, log=True),
             "subsample": trial.suggest_float("subsample", 0.6, 1.0),
             "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
             "min_child_weight": trial.suggest_int("min_child_weight", 1, 6),
             "reg_lambda": trial.suggest_float("reg_lambda", 0.5, 5.0)}
        folds = stratified_group_folds(feat, n_splits=5, seed=42)
        scores = []
        for tr, te in folds:
            m = XGBClassifier(n_estimators=500, n_jobs=-1, eval_metric="mlogloss",
                              random_state=42, **p)
            m.fit(X[tr], y[tr])
            from src.evaluate import early_pest_recall
            pred_str = le_opt.inverse_transform(m.predict(X[te]))
            scores.append(early_pest_recall(y_str[te], pred_str, th[te]))
        return float(np.mean(scores))

    study = optuna.create_study(direction="maximize")
    study.optimize(objective, n_trials=trials)
    best = study.best_params
    s, oof = run_cv(feat, lambda: XGBClassifier(n_estimators=800, n_jobs=-1,
                                                eval_metric="mlogloss", random_state=42, **best), False,
                   encode_labels=True)
    results["xgb_tuned"] = {**agg(s), "best_params": best}
    results["gate"] = {"early_recall_target": 0.85, "mech_to_pest_limit": 0.05,
                       "pass": bool(results["xgb_tuned"]["mean_early_recall"] >= 0.85
                                     and results["xgb_tuned"]["mean_mech_to_pest"] <= 0.05)}

    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    with open(out, "w") as f:
        json.dump(results, f, indent=2)
    for k, v in results.items():
        if k in ("gate",):
            continue
        print(f"{k:12s} early={v['mean_early_recall']:.3f}±{v['std_early_recall']:.3f} "
              f"mech->pest={v['mean_mech_to_pest']:.3f} per_time={v['per_time_mean']}")
    print("GATE:", results["gate"], "| best:", best)
    return results


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--features", default="processed/features.parquet")
    ap.add_argument("--trials", type=int, default=100)
    ap.add_argument("--out", default="reports/baseline_head1.json")
    a = ap.parse_args()
    main(a.features, a.trials, a.out)
