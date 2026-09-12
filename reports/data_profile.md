# Data profile (locked)

- Raw: 4,410,000 rows @0.1s, 2100 SampleIDs, 880MB.
- Design: 5 treatments (Control/Low/Medium/High/Mechanical) x 7 Time_h (1,3,6,12,24,48,168) x 60 reps, balanced 60/cell.
- Plants: 300 (`plant_id = Treatment_Replicate`), longitudinal, 7 exposures each.
- Cycle/SampleID (~2100 rows): baseline 0-29.9s ~300 rows, acquisition 30-149.9s ~1200 rows, recovery 150-209.9s ~600 rows.
- Features: `processed/features.parquet` 2100x83 (Peak/AUC/Slope/SteadyState x9 sensors + array-ratio copies + recovery_return/auc + y_L1/y_L2).
- QA: 0 missing baselines, 0 count drifts, R0_fallback=0.
- Splits: GroupKFold by plant_id, stratify by Treatment; validate zero plant overlap.
