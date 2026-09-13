import pandas as pd
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report


# 1. Load train and test features
train = pd.read_parquet("smoke_test/train_features.parquet")
test = pd.read_parquet("smoke_test/test_features.parquet")


# 2. Keep only valid severity labels
valid_labels = ["Low", "Medium", "High"]

train = train[train["y_L2"].isin(valid_labels)].copy()
test = test[test["y_L2"].isin(valid_labels)].copy()

# 3. Select the 72 ML features
feature_cols = [c for c in train.columns if "__" in c]

X_train = train[feature_cols]
X_test = test[feature_cols]

y_train = train["y_L2"].astype(str)
y_test = test["y_L2"].astype(str)

print("Train samples:", len(train))
print("Test samples :", len(test))
print("Features     :", len(feature_cols))


# 4. Convert severity labels to numbers
label_map = {
    "High": 0,
    "Low": 1,
    "Medium": 2
}

y_train = y_train.map(label_map)
y_test = y_test.map(label_map)

print("\nTraining labels:")
print(y_train.value_counts())

print("\nTest labels:")
print(y_test.value_counts())

# 5. Create Head-2 XGBoost
model = XGBClassifier(
    n_estimators=600,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    n_jobs=-1,
    objective="multi:softprob",
    eval_metric="mlogloss",
    random_state=42
)


# 6. Train ONLY on training plants
print("\nTraining Head-2 XGBoost...")

model.fit(X_train, y_train)

print("Training complete!")


# 7. Predict unseen test plants
pred = model.predict(X_test)


# 8. Accuracy
accuracy = accuracy_score(y_test, pred)

print("\nHead-2 Accuracy:", accuracy)


# 9. Confusion matrix
cm = confusion_matrix(
    y_test,
    pred,
    labels=[0, 1, 2]
)

print("\nConfusion Matrix:")
print(cm)


# 10. Classification report
print("\nClassification Report:")

print(
    classification_report(
        y_test,
        pred,
        labels=[0, 1, 2],
        target_names=["High", "Low", "Medium"]
    )
)


# 11. Accuracy at each time
print("\nAccuracy by Time:")

for t in [1, 3, 6, 12, 24, 48, 168]:

    mask = test["Time_h"] == t

    if mask.sum() > 0:
        acc = accuracy_score(
            y_test[mask],
            pred[mask]
        )

        print(f"{t}h : {acc:.3f}")

        # 12. Feature importance
print("\nTop 15 important features:")

importance = pd.Series(
    model.feature_importances_,
    index=feature_cols
).sort_values(ascending=False)

print(importance.head(15))