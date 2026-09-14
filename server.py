"""FastAPI backend serving the real XGBoost model to the VOCguard frontend.

Endpoints:
  GET  /health   → server status + loaded model info
  GET  /models   → model params, feature count, label classes
  POST /predict  → raw sensor cycle → Head-1 → Head-2 → IPM advisory
"""
from __future__ import annotations
import json, os, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.predict import Predictor

app = FastAPI(title="VOCguard API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = Predictor(
    model_dir=str(ROOT / "models"),
    kb_path=str(ROOT / "advisory" / "kb.csv"),
)
_startup_time = time.time()


class PredictRequest(BaseModel):
    readings: dict
    meta: dict


class PredictResponse(BaseModel):
    pred_L1: str
    pred_L2: str | None
    advisory: str
    confidence: float
    qa_issues: str
    mode: str = "FastAPI /predict"


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "models_loaded": ["head1_xgb.json", "head2_xgb.json"],
        "feature_count": len(predictor.features),
        "uptime_seconds": round(time.time() - _startup_time, 1),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime()),
    }


@app.get("/models")
def models():
    lc_path = os.path.join(ROOT, "models", "label_classes.json")
    with open(lc_path) as f:
        lc = json.load(f)
    return {
        "head1_params": lc["head1_params"],
        "head2_params": lc["head2_params"],
        "feature_count": len(predictor.features),
        "label_classes": {"y_L1": lc["y_L1"], "y_L2": lc["y_L2"]},
        "top15_importance": lc["top15_head1_importance"],
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    result = predictor.predict_live(req.readings, req.meta or {})
    return PredictResponse(**result)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
