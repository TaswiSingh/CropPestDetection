"""Leakage-safe splits: GroupKFold by plant_id (Treatment_Replicate, longitudinal).

All 7 Time_h exposures of a plant live in one fold. Folds balanced by Treatment
via round-robin assignment of shuffled plants within each Treatment.
"""
from __future__ import annotations
import numpy as np
import pandas as pd

N_SPLITS = 5


def plant_table(feat: pd.DataFrame) -> pd.DataFrame:
    return (feat.groupby(["plant_id", "Treatment"], as_index=False)
            .agg(n_samples=("SampleID", "nunique")))


def stratified_group_folds(feat: pd.DataFrame, n_splits: int = N_SPLITS, seed: int = 42) -> list[tuple[np.ndarray, np.ndarray]]:
    rng = np.random.default_rng(seed)
    plants = plant_table(feat)
    fold_of: dict[str, int] = {}
    for trt, g in plants.groupby("Treatment"):
        ids = g["plant_id"].sample(frac=1, random_state=seed).tolist()
        for i, pid in enumerate(ids):
            fold_of[pid] = i % n_splits
    idx = np.arange(len(feat))
    folds = []
    for f in range(n_splits):
        te = feat["plant_id"].map(fold_of).to_numpy() == f
        folds.append((idx[~te], idx[te]))
    return folds


def assert_no_leakage(feat: pd.DataFrame, tr_idx, te_idx) -> None:
    tr = set(feat.iloc[tr_idx]["plant_id"])
    te = set(feat.iloc[te_idx]["plant_id"])
    assert not tr & te, f"LEAKAGE: {tr & te}"
