# import pandas as pd
# f = pd.read_parquet('processed/features.parquet')
# print(f.shape)  # expect (2100, 83)
# print(f.groupby(['Treatment','Time_h']).size())  # every cell 60
# print('plants:', f.plant_id.nunique())  # 300
# print('fallback:', f.R0_fallback.sum(), 'bad QA:', (f.qa_issues!='').sum())  # 0, 0
import pandas as pd
from src.splits import stratified_group_folds, assert_no_leakage

f = pd.read_parquet('processed/features.parquet')
folds = stratified_group_folds(f)

for train_data, test_data in folds: 
    assert_no_leakage(f, train_data, test_data)
    
print('Success: No plant leakage detected across folds.')