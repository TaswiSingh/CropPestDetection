import pandas as pd
from xgboost import XGBClassifier

# Load features
df = pd.read_parquet("smoke_test/features.parquet")

# 72 ML features
feature_cols = [c for c in df.columns if "__" in c]

X = df[feature_cols]

# Head-1 labels
y = df["y_L1"].map({
    "Control": 0,
    "Mechanical": 1,
    "Pest": 2
})

print("X shape:", X.shape)
print("y:", y.tolist())

# Tiny XGBoost model
model = XGBClassifier(
    n_estimators=10,
    max_depth=2,
    learning_rate=0.1,
    objective="multi:softmax",
    num_class=3,
    eval_metric="mlogloss",
    random_state=42
)

# Train
model.fit(X, y)

print("Training successful!")

# Predict
pred = model.predict(X)

print("Predictions:", pred.tolist())
print("Actual:     ", y.tolist())

print("XGBoost smoke test PASSED!")