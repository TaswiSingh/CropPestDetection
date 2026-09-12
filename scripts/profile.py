"""Chunked profiler: run locally, paste results, never commit the CSV."""
import pandas as pd
from src.ingestion import SENSORS

P = "e_nose_thrips_60rep_per_treat_time.csv"
df = pd.read_csv(P, usecols=["SampleID", "Treatment", "Time_h", "Replicate", "Phase"])
print("rows:", len(df), "| samples:", df.SampleID.nunique())
print(df.Treatment.unique(), sorted(df.Time_h.unique()))
print("plants:", df.assign(p=df.Treatment + "_" + df.Replicate.astype(str)).p.nunique())
print(df.groupby("Phase").size())
