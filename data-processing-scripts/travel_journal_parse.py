import csv
import os
import json
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient
from tqdm import tqdm

restaurantData = {}
pointOfInterestData = {}
load_dotenv()

with open(os.getenv('RESTAURANTS_DATA_PATH')) as f:
    reader = csv.reader(f)
    next(reader) # skip header
    
    for row in reader:
        rest_id = row[0]
        pointOfInterestData[rest_id] = {
            "pointId": rest_id,
            "type": "restaurant",
            'foodCost': float(row[1]),
            'maxOccupancy': int(row[2]),
            'buildingId': int(row[4]),
            'location': row[3]
        }

employersData = {}
with open(os.getenv('EMPLOYERS_DATA_PATH')) as f:
    reader = csv.reader(f)
    next(reader) # skip header
    
    for row in reader:
        emp_id = row[0]
        pointOfInterestData[emp_id] = {
            "pointId": emp_id,
            "type": "employer",
            "location": row[1],
        }

apaertmentData = {}
with open(os.getenv('APARTMENTS_DATA_PATH')) as f:
    reader = csv.reader(f)
    next(reader) # skip header
    
    for row in reader:
        apt_id = row[0]
        pointOfInterestData[apt_id] = {
            "pointId": apt_id,
            "type": "home",
            "maxOccupancy": int(row[2]),
            "rentalCost": float(row[1]),
            "numberOfRooms": int(row[3]),
            "location": row[4],
        }
        

pubData = {}
with open(os.getenv('PUBS_DATA_PATH')) as f:
    reader = csv.reader(f)
    next(reader) # skip header
    
    for row in reader:
        pub_id = row[0]
        pointOfInterestData[pub_id] = {
            "pointId": pub_id,
            "type": "pub",
            "hourlyCost": float(row[1]),
            "maxOccupancy": int(row[2]),
            "location": row[3],
        }

schoolData = {}
with open(os.getenv('SCHOOLS_DATA_PATH')) as f:
    reader = csv.reader(f)
    next(reader) # skip header
    
    for row in reader:
        school_id = row[0]
        pointOfInterestData[school_id] = {
            "pointId": school_id,
            "type": "school",
            "hourlyCost": float(row[1]),
            "maxOccupancy": int(row[2]),
            "location": row[3],
        }

os.makedirs('../parsedData', exist_ok=True)

with open('../parsedData/building_specifics.json', 'w') as json_file:
    json.dump(pointOfInterestData, json_file, indent=4)
print("The file building_specifics.json has been successfully created in the parsedData directory.")

masterTravelData = []
def reassignPurpose(start, purpose, end):
    if (end in pointOfInterestData and  pointOfInterestData[end]['type'] == 'employer'):
        purpose = "Work"

    if (end in pointOfInterestData and pointOfInterestData[end]['type'] == 'restaurant'):
        purpose = "Restaurant" 
        
    
    elif (end in pointOfInterestData and pointOfInterestData[end]['type'] == 'school'):
        purpose = "School"

    elif (end in pointOfInterestData and pointOfInterestData[end]['type'] == 'pub'):
        purpose = "Pub"
    
    elif (end in pointOfInterestData and pointOfInterestData[end]['type'] == 'home'):
        purpose = "Home"

    end = pointOfInterestData[end]

            
    return purpose,end

start_time_min = datetime.fromisoformat('2022-03-01T05:00:00').replace(tzinfo=timezone.utc)
end_time_max = datetime.fromisoformat('2023-03-01T05:00:00').replace(tzinfo=timezone.utc)

with open(os.getenv('TRAVEL_JOURNAL_DATA_PATH')) as f:
    reader = csv.DictReader(f)
    # for i in range(0, 30):
    for row in reader:
        # row = next(reader)
        startdate = datetime.fromisoformat(row['travelStartTime'].replace('Z', '')).replace(tzinfo=timezone.utc)
        enddate = datetime.fromisoformat(row['travelEndTime'].replace('Z', '')).replace(tzinfo=timezone.utc)
        if start_time_min <= startdate <= end_time_max and start_time_min <= enddate <= end_time_max:
            participantId = row['participantId']
            
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

            purpose, end = reassignPurpose(start, purpose, end)

            duration = (enddate - startdate).seconds
            
            if (start in pointOfInterestData):
                start = pointOfInterestData[start]
            else:
                start = None

            masterTravelData.append({
                'month': month,
                'dow': dow,
                'tod': tod,
                'purpose': purpose,
                'commute': {
                    'participantId': participantId,
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

# client = MongoClient("mongodb+srv://csedvmc2team:pppasr@cluster0.osfz3hb.mongodb.net/?retryWrites=true&w=majority")

# # Select the database
# db = client['VASTChallenge2021MC2']

# # Select the collection
# collection = db['CommuteSpecifics']


for d in tqdm(masterTravelData, desc="Inserting documents"):
    month = grouped.setdefault(d['month'], {})
    dow = month.setdefault(d['dow'], {})
    tod = dow.setdefault(d['tod'], {})
    purpose = tod.setdefault(d['purpose'], {'commute': []})
    purpose['commute'].append(d['commute'])

    # Insert the data into MongoDB
    # collection.insert_one(d)
    
os.makedirs('../parsedData', exist_ok=True)

with open('../parsedData/commute_specifics.json', 'w') as json_file:
    json.dump(grouped, json_file, indent=4)
print("The file commute_specifics.json has been successfully created in the parsedData directory.")