# Kaggle setup (GitHub + Kaggle link, collab)

## 1. Create private Dataset (web UI, fastest for 880MB)
1. kaggle.com -> Datasets -> New Dataset -> upload `e_nose_thrips_60rep_per_treat_time.csv` (zip first).
2. Title `tomato-thrips-enose`, private. Add file `advisory/kb.csv` later as v2.
3. Copy dataset slug `USERNAME/tomato-thrips-enose`.

## 2. Notebook
1. New Notebook -> + Add Input -> your private dataset + this GitHub repo.
2. Internet ON if `!pip install git+https://github.com/<org>/CropPestDetection.git`.
3. Set `PYTHONPATH` or `%pip install -e` the repo; data at `/kaggle/input/tomato-thrips-enose/`.
4. Run `notebooks/01_eda.ipynb` then `02_features.ipynb` (chunked, writes `/kaggle/output/features.parquet` -> Save Version).

## 3. Collab
Code merges via GitHub PRs. Data pinned by Dataset version number. Teammates Fork notebook, never re-upload CSV.
