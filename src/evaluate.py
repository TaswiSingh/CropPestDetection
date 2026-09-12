"""Evaluation with Time_h masking (watch-out #1).

Objective: mean Pest-recall on 1h-6h slice. Time_h must travel alongside
folds so the mask applies BEFORE scoring. Also tracks Mechanical->Pest
false-alarm rate and per-Time_h early curves.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from sklearn.metrics import recall_score, confusion_matrix

EARLY_WINDOW = (1, 3, 6)
ALL_TIMES = (1, 3, 6, 12, 24, 48, 168)


def to_pest_binary(y: pd.Series | np.ndarray) -> np.ndarray:
    return (pd.Series(y).to_numpy() == "Pest").astype(int)


def early_pest_recall(y_true, y_pred, time_h, window=EARLY_WINDOW) -> float:
    mask = pd.Series(time_h).isin(window).to_numpy()
    if mask.sum() == 0:
        return float("nan")
    return float(recall_score(to_pest_binary(y_true)[mask],
                              to_pest_binary(np.asarray(y_pred)[mask]),
                              zero_division=0))


def mech_to_pest_rate(y_true, y_pred) -> float:
    yt, yp = np.asarray(y_true), np.asarray(y_pred)
    m = yt == "Mechanical"
    return float((yp[m] == "Pest").mean()) if m.sum() else float("nan")


def per_time_pest_recall(y_true, y_pred, time_h) -> dict:
    out = {}
    yt, yp, th = np.asarray(y_true), np.asarray(y_pred), np.asarray(time_h)
    for t in ALL_TIMES:
        m = th == t
        out[t] = float(recall_score(to_pest_binary(yt[m]), to_pest_binary(yp[m]),
                                    zero_division=0)) if m.sum() else float("nan")
    return out


def summarize_fold(y_true, y_pred, time_h) -> dict:
    return {
        "early_recall_1h6h": early_pest_recall(y_true, y_pred, time_h),
        "mech_to_pest": mech_to_pest_rate(y_true, y_pred),
        "per_time": per_time_pest_recall(y_true, y_pred, time_h),
        "confusion": confusion_matrix(y_true, y_pred,
                                      labels=["Control", "Mechanical", "Pest"]).tolist(),
    }
