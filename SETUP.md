# Setup Guide — CropPestDetection

## Prerequisites

- Python 3.13+
- Node.js 18+ (with npm)
- Git

## 1. Clone the repository

```bash
git clone <repo-url>
cd CropPestDetection
```

## 2. Python dependencies

```bash
pip install -r requirements.txt
```

This installs: pandas, numpy, scikit-learn, scipy, pyarrow, xgboost, optuna, matplotlib, fastapi, uvicorn.

## 3. Node.js dependencies (frontend)

```bash
cd VOCguard-frontend-updated/VOCguard-frontend
npm install
```

This installs React, Vite, Recharts, Lucide React, and other frontend dependencies.

> **Note:** `node_modules/` is in `.gitignore` and must be installed locally.

## 4. Get the dataset

The raw 880MB CSV (`e_nose_thrips_60rep_per_treat_time.csv`) is not on GitHub — it's a private Kaggle dataset. You have two options:

**Option A — Kaggle:**
1. Go to [kaggle.com](https://kaggle.com) and accept the `tomato-thrips-enose` dataset
2. Download `e_nose_thrips_60rep_per_treat_time.csv`
3. Place it in `datasets/`

**Option B — Use your own CSV** with the same schema: 2100 rows per SampleID (300 baseline + 1200 acquisition + 600 recovery @ 0.1s), 9 sensor columns.

## 5. Generate features (optional — only if using CSV replay)

```bash
python scripts/make_features.py --input datasets/e_nose_thrips_60rep_per_treat_time.csv --output processed/features.parquet
```

Skip this step if you only need real-time inference (the server works with any sensor readings).

## 6. Start the backend API server

```bash
cd D:\crop\CropPestDetection
python server.py
```

The server starts on `http://localhost:8000` with three endpoints:
- `GET /health` — server status and model info
- `GET /models` — model parameters and feature count
- `POST /predict` — raw sensor cycle → prediction

## 7. Start the frontend

```bash
cd VOCguard-frontend-updated/VOCguard-frontend
npm run dev
```

Opens on `http://localhost:5173`. Navigate to **Live Monitor**, adjust the 9 sensor sliders, and click **Run Scan**.

## Verify everything works

1. Open `http://localhost:8000/health` → should return `{status: healthy, feature_count: 72, ...}`
2. Open `http://localhost:8000/models` → should return model parameters
3. Open `http://localhost:5173` → should show the VOCguard UI
4. Run a scan in **Live Monitor** → should show real XGBoost predictions with confidence score

## Project structure

```
CropPestDetection/
├── src/                    # Python ML pipeline
│   ├── ingestion.py        # CSV-replay + live-IoT data loading
│   ├── features.py         # Feature engineering (72 features)
│   ├── splits.py           # Plant-grouped stratified 5-fold CV
│   ├── train_baseline.py   # Head-1 training with Optuna
│   ├── train_head2.py      # Head-2 severity training
│   ├── evaluate.py         # Metrics with Time_h masking
│   ├── predict.py          # Inference pipeline (used by server.py)
│   ├── export_models.py    # Export pre-trained model artifacts
│   └── plots.py            # Generate figures from JSON reports
├── server.py               # FastAPI backend (connects model to frontend)
├── models/                 # Pre-trained XGBoost models (tracked in git)
│   ├── head1_xgb.json      # Head-1: Control/Mechanical/Pest
│   ├── head2_xgb.json      # Head-2: Low/Medium/High severity
│   ├── feature_list.json   # 72 feature names
│   └── label_classes.json  # Label encoders + model params
├── advisory/               # Deterministic IPM action lookup
│   ├── kb.csv              # Prediction → action mapping
│   └── lookup.py
├── scripts/                # Data processing and validation scripts
├── datasets/               # Raw 880MB CSV (NOT in git)
├── processed/              # Generated features.parquet (NOT in git)
├── reports/                # Training metrics and JSON reports
├── smoke_test/             # Validation test scripts
├── notebooks/              # EDA and analysis notebooks
└── VOCguard-frontend-updated/VOCguard-frontend/  # React frontend
    ├── src/
    │   ├── services/mlService.js  # API client (real model or mock)
    │   ├── data/sensors.js        # 9 sensor definitions + presets
    │   └── App.jsx                # Main React component
    ├── .env                     # VITE_API_URL=http://localhost:8000/predict
    └── package.json
```

## Troubleshooting

**Frontend shows "Demo simulator" instead of real predictions:**
- Make sure `server.py` is running on port 8000
- Check that `VOCguard-frontend-updated/VOCguard-frontend/.env` contains `VITE_API_URL=http://localhost:8000/predict`
- The `mlService.js` falls back to mock if the API is unreachable

**Backend returns errors about missing models:**
- Ensure `models/head1_xgb.json` and `models/head2_xgb.json` exist
- Run `python server.py` from the project root directory

**`npm install` fails:**
- Make sure Node.js 18+ is installed: `node --version`
- Delete `node_modules/` and `package-lock.json`, then run `npm install` again
