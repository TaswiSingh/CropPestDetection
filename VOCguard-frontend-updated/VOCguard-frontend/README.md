# VOCguard Frontend — Sensor Simulator

A React + Vite frontend for the VOCguard crop intelligence prototype.

## ML reference used
This UI is aligned to the `TaswiSingh/CropPestDetection` ML repository:
- 9 raw e-nose channels: TGS2600, TGS2602, TGS822, MQ3, MQ135, MQ138, MiCS_NO2, MiCS_NH3, MiCS_CO.
- Inference expects a sensor cycle with baseline, acquisition and recovery phases.
- The repository's feature pipeline creates 72 model features: Peak, AUC, Slope, Steady and per-feature ratios.
- Head-1 labels: Control / Mechanical / Pest.
- Head-2 labels for Pest: High / Low / Medium.
- Temperature and humidity are included in this frontend as field context; they are NOT among the 72 listed XGBoost features in the supplied feature list.

## Run
```bash
npm install
npm run dev
```

## Backend connection
Create `.env`:
```env
VITE_API_URL=http://localhost:8000/predict
```
The frontend sends:
```json
{
  "readings": {
    "Time_s": [], "Phase": [],
    "TGS2600": [], "TGS2602": [], "TGS822": [], "MQ3": [], "MQ135": [], "MQ138": [],
    "MiCS_NO2": [], "MiCS_NH3": [], "MiCS_CO": []
  },
  "meta": {"crop":"Tomato","plot":"Plot A-01","temperature":25,"humidity":60}
}
```

The frontend deliberately keeps the ML integration behind `src/services/mlService.js`. Without a backend, it uses a clearly labelled deterministic simulator so the UI remains demoable. The simulator presets alter sensor values; they do not directly force a label.

## Important
The real repository model should be called through the Python/FastAPI inference pipeline because the XGBoost models operate on the engineered 72-feature vector, not directly on nine single slider values. The frontend generates a 210-second synthetic sensor cycle to match the repository's live-ingestion protocol.
