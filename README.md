# CropPestDetection — tomato thrips e-nose

Longitudinal e-nose: 2100 exposures (5 treatments x 7 Time_h x 60 reps), 300 plants.
`plant_id = Treatment_Replicate`. Per exposure: baseline 30s / acquisition 120s / recovery 60s @0.1s.

## Data engineering (done)
- `src/ingestion.py` — chunked `iter_samples_csv` + `UniversalSensorLoader` (CSV-replay = live-IoT schema)
- `src/features.py` — per-SampleID R0 median -> dR/R0 -> Peak/AUC/Slope/SteadyState + array-ratio + recovery QA
- `src/splits.py` — stratified GroupKFold by `plant_id`, zero plant leakage
- `scripts/make_features.py` — full build: `python scripts/make_features.py --input <csv> --output processed/features.parquet`
- Kaggle: see `scripts/kaggle_setup.md`; code in GitHub, 880MB CSV as private Kaggle Dataset only.

## Labels
Head-1 `y_L1`: Control / Mechanical / Pest. Head-2 `y_L2` (pest only): Low / Medium / High.
`advisory/` maps predictions -> IPM actions (Shinde KB, deterministic, no training).
