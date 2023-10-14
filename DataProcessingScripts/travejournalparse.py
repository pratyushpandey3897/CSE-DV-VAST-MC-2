import csv
import json
from datetime import datetime, timezone


buildingdata = {}

with open('../Datasets/Attributes/Restaurants.csv') as f:
    reader = csv.reader(f)
    next(reader) # skip header
    
    for row in reader:
        rest_id = row[0]
        
        buildingdata[rest_id] = {
            'foodCost': float(row[1]),
            'maxOccupancy': int(row[2]),
            'buildingId': int(row[4]),
            'location': row[3]
        }

json_data = json.dumps(buildingdata, indent=4) 

# print(json_data)

masterTravelData = []
with open('../Datasets/Journals/TravelJournal.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # row = next(reader)
        startdate = datetime.fromisoformat(row['travelStartTime']).replace(tzinfo=timezone.utc)
        enddate = datetime.fromisoformat(row['travelEndTime'].replace('Z', '')).replace(tzinfo=timezone.utc)
        checkintime = datetime.fromisoformat(row['checkInTime'].replace('Z', '')).replace(tzinfo=timezone.utc)
        checkouttime = datetime.fromisoformat(row['checkOutTime'].replace('Z', '')).replace(tzinfo=timezone.utc)
        timespent = ((checkouttime - checkintime).seconds)/60
        startingbalance = float(row['startingBalance'])
        endingbalance = float(row['endingBalance'])
        moneydiff = startingbalance - endingbalance

        month = startdate.strftime('%B')  
        dow = startdate.strftime('%A')
        tod = 'morning' if startdate.hour < 12 else 'afternoon' if startdate.hour < 17 else 'evening'
        purpose = row['purpose']
        
        start = row['travelStartLocationId']
        end = row['travelEndLocationId']
        if purpose == 'Eating' and end in buildingdata:
            end = {
                'locationId': end,
                'buildingDetails': buildingdata[end]
            }
        duration = (enddate - startdate).seconds
        
        masterTravelData.append({
            'month': month,
            'dow': dow,
            'tod': tod,
            'purpose': purpose,
            'locations': {
                'start': start,
                'end': end,
                'starttime': startdate.isoformat(),
                'endtime': enddate.isoformat(),
                'duration': duration,
                'checkintime': checkintime.isoformat(),
                'checkouttime': checkouttime.isoformat(),
                'timespent': timespent,
                'startingbalance': startingbalance,
                'endingbalance': endingbalance,
                'moneydiff': moneydiff
            }
        })

grouped = {}
for d in masterTravelData:
    month = grouped.setdefault(d['month'], {})
    dow = month.setdefault(d['dow'], {})
    tod = dow.setdefault(d['tod'], {})
    purpose = tod.setdefault(d['purpose'], {'locations': []})
    purpose['locations'].append(d['locations'])
    
json_data = json.dumps(grouped, indent=4)
print(json_data)