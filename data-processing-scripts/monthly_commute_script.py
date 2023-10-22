import csv
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()
os.makedirs('../parsedData', exist_ok=True)

monthlyCommutes = {}

with open(os.getenv('TRAVEL_JOURNAL_DATA_PATH')) as f:
    reader = csv.DictReader(f)
    for row in reader:
        startdate = datetime.fromisoformat(row['travelStartTime'].replace('Z', '')).replace(tzinfo=timezone.utc)
        month = startdate.strftime('%B')
        monthlyCommutes[month] = monthlyCommutes.get(month, 0) + 1

with open('../parsedData/monthly_commutes.json', 'w') as json_file:
    json.dump(monthlyCommutes, json_file, indent=4)