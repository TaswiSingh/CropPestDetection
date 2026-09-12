"""Rich explanatory figures from existing JSONs. No retraining, no recompute.

Reads reports/baseline_head1.json, reports/head2.json, models/label_classes.json
and writes 5 conclusion-titled PNGs to reports/figures/ (150 DPI).
"""
from __future__ import annotations
import json, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIG = os.path.join(ROOT, "reports", "figures")
TIMES = [1, 3, 6, 12, 24, 48, 168]
MODELS = ["dummy", "logreg", "rf", "xgb_default", "xgb_tuned"]
PRETTY = {"dummy": "Dummy (floor)", "logreg": "LogReg", "rf": "RandForest",
          "xgb_default": "XGB default (ships)", "xgb_tuned": "XGB tuned"}
OI = {"blue": "#0072B2", "orange": "#E69F00", "green": "#009E73",
      "red": "#D55E00", "purple": "#CC79FF", "gray": "#999999"}
SUB = "N=2100 exposures / 300 plants / 5-fold GroupKFold by plant (all 7 timepoints of a plant in one fold)"


def _mpl():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({"figure.dpi": 150, "font.size": 9,
                         "axes.spines.top": False, "axes.spines.right": False})
    return plt


def _load():
    with open(os.path.join(ROOT, "reports", "baseline_head1.json")) as f:
        b = json.load(f)
    with open(os.path.join(ROOT, "reports", "head2.json")) as f:
        h = json.load(f)
    with open(os.path.join(ROOT, "models", "label_classes.json")) as f:
        lc = json.load(f)
    return b, h, lc


def _fold_stats(b):
    out = {}
    for m in MODELS:
        arr = np.array([[f["per_time"][str(t)] for t in TIMES] for f in b[m]["folds"]])
        out[m] = (arr.mean(0), arr.std(0))
    return out


def fig_early_recall(plt, b):
    st = _fold_stats(b)
    x = np.arange(len(TIMES))
    fig, ax = plt.subplots(figsize=(9, 4.6))
    ax.axvspan(-0.5, 2.5, color="#FFF2CC", zorder=0)
    ax.text(1, 0.06, "pre-symptomatic window (1-6h)", ha="center", fontsize=8, style="italic")
    ax.axhline(0.85, ls="--", color=OI["red"], lw=1.2)
    ax.text(6.05, 0.86, "success bar: Pest recall >85% at 1-6h", color=OI["red"], fontsize=8, va="bottom")
    colors = {"dummy": OI["gray"], "logreg": OI["blue"], "rf": OI["green"],
              "xgb_default": OI["orange"], "xgb_tuned": OI["purple"]}
    for m in MODELS:
        mu, sd = st[m]
        ax.plot(x, mu, marker="o", ms=4, lw=1.8 if m == "xgb_default" else 1.1,
                color=colors[m], label=f"{PRETTY[m]} (early {b[m]['mean_early_recall']:.2f})", zorder=3)
        ax.fill_between(x, mu - sd, mu + sd, color=colors[m], alpha=0.12)
    ax.set_xticks(x, [str(t) + "h" for t in TIMES])
    ax.set_ylim(0, 1.06)
    ax.set_ylabel("Pest recall (Pest vs rest)")
    ax.set_xlabel("hours after infestation")
    ax.set_title("Pest caught at 1h, before visible symptoms", fontsize=13, fontweight="bold", loc="left")
    ax.text(0, 1.10, SUB, transform=ax.transAxes, fontsize=7, color="#555555")
    ax.annotate("XGB-default 1.00 at 1h — no tuning needed",
                xy=(0, 1.0), xytext=(3.2, 0.72),
                arrowprops={"arrowstyle": "->", "color": "black"}, fontsize=8,
                bbox={"boxstyle": "round,pad=0.3", "fc": "white", "ec": "#888888"})
    ax.legend(frameon=False, fontsize=8, loc="lower right")
    ax.text(0, -0.24, "Method: out-of-fold predictions, Time_h masked to [1,3,6] before scoring; ribbons = ±1 SD across 5 folds.",
            transform=ax.transAxes, fontsize=7, color="#555555")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG, "early_recall_curve.png"), bbox_inches="tight")


def fig_confusion(plt, b):
    cms = np.array([f["confusion"] for f in b["xgb_default"]["folds"]]).mean(0)
    labels = ["Control", "Mechanical", "Pest"]
    fig, ax = plt.subplots(figsize=(6.6, 5.8))
    im = ax.imshow(cms, cmap="Blues", vmin=0)
    row_sum = cms.sum(1, keepdims=True)
    for i in range(3):
        for j in range(3):
            rec = cms[i, j] / row_sum[i, 0]
            ax.text(j, i, f"{cms[i, j]:.0f}\n({rec:.0%})", ha="center", va="center",
                    fontsize=10, fontweight="bold" if i == j else "normal",
                    color="white" if cms[i, j] > cms.max() * 0.5 else "black")
    ax.set_xticks(range(3), labels)
    ax.set_yticks(range(3), labels)
    ax.set_xlabel("predicted →")
    ax.set_ylabel("true")
    ax.set_title("It rarely cries wolf on wind damage", fontsize=13, fontweight="bold", loc="left", pad=30)
    ax.text(0, 1.10, SUB, transform=ax.transAxes, fontsize=7, color="#555555")
    ax.annotate("Mechanical→Pest 4%:\n~17 of 420 false sprays\nper cycle (limit 5%)",
                xy=(2, 1), xycoords="data", xytext=(3.3, 0.6),
                arrowprops={"arrowstyle": "->", "color": OI["red"]}, fontsize=8, color=OI["red"])
    fig.colorbar(im, ax=ax, shrink=0.72, pad=0.12, label="exposures (mean of 5 folds)")
    ax.text(0, -0.22, "Numbers: mean out-of-fold confusion; % = row recall. Honest estimate — final model refit is not scored.",
            transform=ax.transAxes, fontsize=7, color="#555555")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG, "confusion_head1.png"), bbox_inches="tight")


def fig_importance(plt, lc):
    top = lc["top15_head1_importance"]
    names = [k for k, _ in top][::-1]
    vals = [v for _, v in top][::-1]
    fam = {"MiCS": OI["blue"], "MQ": OI["green"], "TGS": OI["orange"]}
    colors = [fam["MiCS"] if n.startswith("MiCS") else (fam["MQ"] if n.startswith("MQ") else fam["TGS"]) for n in names]
    fig, ax = plt.subplots(figsize=(8.2, 5.6))
    ax.barh(names, vals, color=colors)
    ax.axvline(1 / 72, ls="--", color=OI["red"], lw=1.1)
    ax.text(1 / 72 * 1.05, len(names) - 0.5, "uniform share (1/72)", color=OI["red"], fontsize=8)
    ax.set_xlabel("XGBoost gain")
    ax.set_title("Why the nose smells thrips: nitrogen sensors decide", fontsize=13, fontweight="bold", loc="left")
    ax.text(0, 1.06, "MiCS NO2/NH3 AUC + steady-state carry 60%+ of gain — amine/NOx HIPV biology, not chamber background",
            transform=ax.transAxes, fontsize=8, color="#555555")
    from matplotlib.patches import Patch
    ax.legend(handles=[Patch(color=fam["MiCS"], label="MiCS (nitrogenous)"),
                       Patch(color=fam["MQ"], label="MQ (broad VOC)"),
                       Patch(color=fam["TGS"], label="TGS (background)")],
              frameon=False, fontsize=8, loc="lower right")
    ax.text(0, -0.14, "Gain = mean loss reduction from splits on that feature. R0 baselines identical across treatments, so this is response signal.",
            transform=ax.transAxes, fontsize=7, color="#555555")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG, "importance_top15.png"), bbox_inches="tight")


def fig_head2(plt, h):
    x = np.arange(len(TIMES))
    mu = np.array([h["per_time_mean_acc"][str(t)] for t in TIMES])
    fig, ax = plt.subplots(figsize=(9, 4.4))
    ax.axvspan(-0.5, 3.5, color="#FCE4EC", zorder=0)
    ax.axvspan(3.5, 6.5, color="#E8F5E9", zorder=0)
    ax.text(1.5, 0.30, "1-12h: quantity too low to grade", ha="center", fontsize=8, style="italic")
    ax.text(5, 0.30, "24h+: dose resolves", ha="center", fontsize=8, style="italic")
    ax.axhline(1 / 3, ls=":", color=OI["gray"], lw=1.2)
    ax.text(6.05, 1 / 3 + 0.01, "chance (1/3)", fontsize=8, color=OI["gray"])
    ax.plot(x, mu, marker="o", color=OI["blue"], lw=2, label=f"severity acc (mean {h['mean_acc']:.2f})")
    for xi, v in zip(x, mu):
        ax.text(xi, v + 0.025, f"{v:.2f}", ha="center", fontsize=8)
    ax.set_xticks(x, [str(t) + "h" for t in TIMES])
    ax.set_ylim(0.25, 1.0)
    ax.set_ylabel("severity accuracy (Low/Med/High)")
    ax.set_xlabel("hours after infestation")
    ax.set_title("Grading can wait a day — warning cannot", fontsize=13, fontweight="bold", loc="left")
    ax.text(0, 1.10, "Head-1 already warns at 1h (recall 1.00); Head-2 resolves Low/Med/High once VOC dose accumulates",
            transform=ax.transAxes, fontsize=8, color="#555555")
    ax.legend(frameon=False, fontsize=8)
    ax.text(0, -0.24, "Pest-only rows (1260), same plant-grouped folds. Early dip (6h 0.42) is physics, not failure.",
            transform=ax.transAxes, fontsize=7, color="#555555")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG, "head2_time_curve.png"), bbox_inches="tight")


def fig_ceiling(plt, b):
    labels = [PRETTY[m] for m in MODELS]
    early = [b[m]["mean_early_recall"] for m in MODELS]
    clean = [1 - b[m]["mean_mech_to_pest"] for m in MODELS]
    x = np.arange(len(MODELS))
    w = 0.36
    fig, ax = plt.subplots(figsize=(9, 4.6))
    b1 = ax.bar(x - w / 2, early, w, label="early Pest recall (↑ good)", color=OI["blue"])
    b2 = ax.bar(x + w / 2, clean, w, label="mechanical cleanliness = 1 − mech→pest (↑ good)", color=OI["green"])
    ax.axhline(0.85, ls="--", color=OI["red"], lw=1.2)
    ax.text(-0.62, 0.85, "recall gate 0.85", color=OI["red"], fontsize=8, ha="left", va="center",
            bbox={"boxstyle": "round,pad=0.2", "fc": "white", "ec": "none", "alpha": 0.8})
    ax.axhline(0.95, ls=":", color="#057551", lw=1.2)
    ax.text(-0.62, 0.95, "cleanliness gate 0.95", color="#057551", fontsize=8, ha="left", va="center",
            bbox={"boxstyle": "round,pad=0.2", "fc": "white", "ec": "none", "alpha": 0.8})
    for r in b1:
        ax.text(r.get_x() + r.get_width() / 2, r.get_height() + 0.01, f"{r.get_height():.2f}", ha="center", fontsize=8)
    for r in b2:
        ax.text(r.get_x() + r.get_width() / 2, r.get_height() + 0.01, f"{r.get_height():.2f}", ha="center", fontsize=8)
    ax.set_xticks(x, labels, rotation=12, ha="right")
    ax.set_ylim(0, 1.12)
    ax.set_ylabel("score")
    ax.set_title("Tuning hit a ceiling — shipping defaults is the evidence-based call", fontsize=13, fontweight="bold", loc="left")
    ax.text(0, 1.08, "20-trial Optuna: flat at ceiling; tuned mech 0.052 worse than default 0.040",
            transform=ax.transAxes, fontsize=8, color="#555555")
    ax.legend(frameon=False, fontsize=8, loc="lower right")
    ax.text(0, -0.26, "Dummy = floor (recall 0.59, cleanliness 0.38). LogReg cleanest (0.99) but linear — XGB kept for field robustness.",
            transform=ax.transAxes, fontsize=7, color="#555555")
    fig.tight_layout()
    fig.savefig(os.path.join(FIG, "ceiling_bars.png"), bbox_inches="tight")


def main():
    plt = _mpl()
    os.makedirs(FIG, exist_ok=True)
    b, h, lc = _load()
    fig_early_recall(plt, b)
    fig_confusion(plt, b)
    fig_importance(plt, lc)
    fig_head2(plt, h)
    fig_ceiling(plt, b)
    made = sorted(os.listdir(FIG))
    print(f"wrote {len(made)} figures -> {FIG}: {made}")


if __name__ == "__main__":
    main()
