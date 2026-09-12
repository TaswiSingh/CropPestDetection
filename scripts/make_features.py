import argparse, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.features import build_features_csv

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="e_nose_thrips_60rep_per_treat_time.csv")
    ap.add_argument("--output", default="processed/features.parquet")
    ap.add_argument("--chunksize", type=int, default=500_000)
    a = ap.parse_args()
    print(build_features_csv(a.input, a.output, a.chunksize))
