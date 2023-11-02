import json

# Load the data
with open('../parsedData/commute_specifics.json', 'r') as f:
    data = json.load(f)

# Initialize a dictionary to store the counts
counts = {}

for month, weekdays in data.items():
    if month not in counts:
        counts[month] = {}
    for weekday, times in weekdays.items():
        if weekday not in counts[month]:
            counts[month][weekday] = {}
        for time, location_types in times.items():
            if time not in counts[month][weekday]:
                counts[month][weekday][time] = {}
            for location_type, details in location_types.items():
                if location_type not in counts[month][weekday][time]:
                    counts[month][weekday][time][location_type] = {}
                for commute in details['commute']:
                    buildingId = commute['end']['pointId']
                    if buildingId not in counts[month][weekday][time][location_type]:
                        counts[month][weekday][time][location_type][buildingId] = 0
                    counts[month][weekday][time][location_type][buildingId] += 1

with open('../parsedData/commuteCounts.json', 'w') as f:
    json.dump(counts, f, indent=4)