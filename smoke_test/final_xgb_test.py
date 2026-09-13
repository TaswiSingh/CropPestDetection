import pandas as pd
import numpy as np

from xgboost import XGBClassifier
from sklearn.metrics import confusion_matrix, classification_report


# -----------------------------
# 1. Load train and test data
# -----------------------------
train = pd.read_parquet("smoke_test/train_features.parquet")
test = pd.read_parquet("smoke_test/test_features.parquet")

print("Train shape:", train.shape)
print("Test shape :", test.shape)


# -----------------------------
# 2. Select the 72 ML features
# -----------------------------
feature_cols = [c for c in train.columns if "__" in c]

X_train = train[feature_cols]
X_test = test[feature_cols]

y_train = train["y_L1"]
y_test = test["y_L1"]


print("Number of features:", len(feature_cols))
print("X_train:", X_train.shape)
print("X_test :", X_test.shape)


# -----------------------------
# 3. Convert labels to numbers
# -----------------------------
label_map = {
    "Control": 0,
    "Mechanical": 1,
    "Pest": 2
}

y_train = y_train.map(label_map)
y_test = y_test.map(label_map)


# -----------------------------
# 4. Create FINAL XGBoost
# -----------------------------
model = XGBClassifier(
    n_estimators=800,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_lambda=1,
    n_jobs=-1,
    objective="multi:softprob",
    eval_metric="mlogloss",
    random_state=42
)


# -----------------------------
# 5. Train ONLY on train data
# -----------------------------
print("\nTraining XGBoost...")

model.fit(X_train, y_train)

print("Training complete!")


# -----------------------------
# 6. Predict unseen test data
# -----------------------------
pred = model.predict(X_test)


# -----------------------------
# 7. Confusion matrix
# -----------------------------
cm = confusion_matrix(
    y_test,
    pred,
    labels=[0, 1, 2]
)

print("\nConfusion Matrix:")
print(cm)


# -----------------------------
# 8. Classification report
# -----------------------------
print("\nClassification Report:")

print(
    classification_report(
        y_test,
        pred,
        labels=[0, 1, 2],
        target_names=["Control", "Mechanical", "Pest"]
    )
)


# -----------------------------
# 9. Mechanical → Pest error
# -----------------------------
mechanical_mask = (y_test == 1)

mechanical_to_pest = np.sum(
    pred[mechanical_mask] == 2
)

total_mechanical = np.sum(mechanical_mask)

rate = mechanical_to_pest / total_mechanical

print("\nMechanical → Pest errors:",
      mechanical_to_pest,
      "/",
      total_mechanical)

print("Mechanical → Pest rate:",
      rate)


# -----------------------------
# 10. Early Pest Recall
# -----------------------------
early_mask = test["Time_h"].isin([1, 3, 6])

true_early_pest = (
    (y_test == 2) &
    early_mask
)

correct_early_pest = (
    (pred == 2) &
    true_early_pest
)

early_recall = (
    correct_early_pest.sum() /
    true_early_pest.sum()
)

print("\nEarly Pest Recall:",
      early_recall)