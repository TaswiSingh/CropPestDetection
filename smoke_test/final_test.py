import pandas as pd
import numpy as np

from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report


TRAIN_FILE = "smoke_test/train_features.parquet"
TEST_FILE = "smoke_test/test_features.parquet"


# ============================================================
# 1. Load data
# ============================================================

train = pd.read_parquet(TRAIN_FILE)
test = pd.read_parquet(TEST_FILE)

FEATURES = [c for c in train.columns if "__" in c]

X_train = train[FEATURES]
X_test = test[FEATURES]

y_train_raw = train["y_L1"]
y_test_raw = test["y_L1"]


# ============================================================
# 2. Encode labels
# ============================================================

le = LabelEncoder()

y_train = le.fit_transform(y_train_raw)
y_test = le.transform(y_test_raw)

print("Classes:", list(le.classes_))
print("Training samples:", len(train))
print("Test samples:", len(test))
print("Features:", len(FEATURES))


# ============================================================
# 3. Scale ONLY using training data
# ============================================================

scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)

# IMPORTANT:
# Test data is transformed using the scaler fitted on TRAIN only.
X_test_scaled = scaler.transform(X_test)


# ============================================================
# 4. Train final Logistic Regression
# ============================================================

model = LogisticRegression(
    max_iter=2000
)

print("\nTraining final model...")

model.fit(X_train_scaled, y_train)


# ============================================================
# 5. FINAL TEST
# ============================================================

pred = model.predict(X_test_scaled)

pred_labels = le.inverse_transform(pred)


# ============================================================
# 6. Overall accuracy
# ============================================================

accuracy = accuracy_score(
    y_test_raw,
    pred_labels
)

print("\n================================")
print("       FINAL TEST RESULT")
print("================================")

print("Accuracy:", accuracy)


# ============================================================
# 7. Classification report
# ============================================================

print("\n===== CLASSIFICATION REPORT =====")

print(
    classification_report(
        y_test_raw,
        pred_labels,
        labels=["Control", "Mechanical", "Pest"],
        zero_division=0
    )
)


# ============================================================
# 8. Confusion matrix
# ============================================================

cm = confusion_matrix(
    y_test_raw,
    pred_labels,
    labels=["Control", "Mechanical", "Pest"]
)

print("\n===== CONFUSION MATRIX =====")

print("             Predicted")
print("             Control  Mechanical  Pest")

for label, row in zip(
    ["Control", "Mechanical", "Pest"],
    cm
):
    print(
        f"{label:11s}",
        row
    )


# ============================================================
# 9. Mechanical -> Pest
# ============================================================

mechanical_mask = (
    y_test_raw == "Mechanical"
)

mechanical_total = mechanical_mask.sum()

mechanical_to_pest = (
    (mechanical_mask) &
    (pred_labels == "Pest")
).sum()

mechanical_rate = (
    mechanical_to_pest / mechanical_total
)

print("\n===== MECHANICAL → PEST =====")

print("Mechanical test samples:", mechanical_total)
print("Predicted as Pest:", mechanical_to_pest)
print("Mechanical → Pest rate:", mechanical_rate)


# ============================================================
# 10. Early Pest Recall (1h, 3h, 6h)
# ============================================================

early_mask = test["Time_h"].isin([1, 3, 6])

true_early_pest = (
    y_test_raw[early_mask] == "Pest"
)

pred_early_pest = (
    pred_labels[early_mask] == "Pest"
)

early_recall = (
    (true_early_pest & pred_early_pest).sum()
    / true_early_pest.sum()
)

print("\n===== EARLY PEST RECALL =====")

print("Early Pest Recall:", early_recall)


# ============================================================
# 11. Per-time Pest Recall
# ============================================================

print("\n===== PER-TIME PEST RECALL =====")

for t in [1, 3, 6, 12, 24, 48, 168]:

    mask = test["Time_h"] == t

    true_pest = (
        y_test_raw[mask] == "Pest"
    )

    pred_pest = (
        pred_labels[mask] == "Pest"
    )

    if true_pest.sum() > 0:

        recall = (
            (true_pest & pred_pest).sum()
            / true_pest.sum()
        )

        print(f"{t:3d}h : {recall:.3f}")