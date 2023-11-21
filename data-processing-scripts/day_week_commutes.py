import json

def calculate_total_commutes(data, month, day):
    total_commutes = 0

    for time_of_day in data[month][day]:
        for location in data[month][day][time_of_day]:
            for commute in data[month][day][time_of_day][location]:
                total_commutes += data[month][day][time_of_day][location][commute]

    return total_commutes

# Load the JSON file
with open('../parsedData/commuteCounts.json') as f:
    data = json.load(f)

# List of weekdays
weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

# Dictionary to store total commutes for each weekday of all months
total_commutes = {}

for month in data:
    total_commutes[month] = {}
    for day in weekdays:
        if day in data[month]:
            total_commutes[month][day] = calculate_total_commutes(data, month, day)

print(total_commutes)
with open('../parsedData/weekday_commutes.json', 'w') as f:
    json.dump(total_commutes, f, indent=4)