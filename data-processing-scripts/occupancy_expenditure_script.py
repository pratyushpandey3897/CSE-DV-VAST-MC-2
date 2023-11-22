import pandas as pd
import json
from datetime import datetime, timedelta

# Read the CSV file
df = pd.read_csv('../data/commercial_expenditures_occupancy.csv')

df['start_time'] = pd.to_datetime(df['start_time']).dt.hour

# Group by commercialId, month, day_of_week, portion_of_day, and start_time
grouped = df.groupby(['commercialId', 'month', 'day_of_week', 'portion_of_day', 'start_time'])

# Calculate total expenditure and total occupancy for each group
result = grouped.agg(
    total_expenditure=pd.NamedAgg(column='expenditures', aggfunc='sum'),
    total_occupancy=pd.NamedAgg(column='commercialId', aggfunc='count')
).reset_index()

# Convert the DataFrame to a nested dictionary
nested_dict = {}
for row in result.itertuples():
    commercialId = row.commercialId
    month = row.month
    day_of_week = row.day_of_week
    portion_of_day = row.portion_of_day
    start_time = str(row.start_time) + ':00:00'
    total_expenditure = row.total_expenditure
    total_occupancy = row.total_occupancy

    if commercialId not in nested_dict:
        nested_dict[commercialId] = {}
    if month not in nested_dict[commercialId]:
        nested_dict[commercialId][month] = {}
    if day_of_week not in nested_dict[commercialId][month]:
        nested_dict[commercialId][month][day_of_week] = {}
    if portion_of_day not in nested_dict[commercialId][month][day_of_week]:
        nested_dict[commercialId][month][day_of_week][portion_of_day] = []

    nested_dict[commercialId][month][day_of_week][portion_of_day].append({
        'time': start_time,
        'total_expenditure': total_expenditure,
        'total_occupancy': total_occupancy
    })
# Write the nested dictionary to a JSON file

with open('../parsedData/expense_occupancy.json', 'w') as f:
    json.dump(nested_dict, f, indent=4)