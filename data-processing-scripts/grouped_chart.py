import csv
from datetime import datetime
from collections import defaultdict
import os
from dotenv import load_dotenv

load_dotenv()
# Initialize a dictionary to store the organized data
organized_data = defaultdict(lambda: defaultdict(
    lambda: defaultdict(lambda: defaultdict(int))))


# Initialize dictionaries to store the mappings
apartment_dict = {}
restaurant_dict = {}
pub_dict = {}
employer_dict = {}

# Read the data from the restaurants CSV file
with open(os.getenv('APARTMENTS_DATA_PATH'), newline='') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=',')
    for row in reader:
        apartment_dict[row['apartmentId']] = 'Home'

# Read the data from the restaurants CSV file
with open(os.getenv('RESTAURANTS_DATA_PATH'), newline='') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=',')
    for row in reader:
        restaurant_dict[row['restaurantId']] = 'Restaurant'

# Read the data from the pubs CSV file
with open(os.getenv('PUBS_DATA_PATH'), newline='') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=',')
    for row in reader:
        pub_dict[row['pubId']] = 'Pub'

# Read the data from the employers CSV file
with open(os.getenv('EMPLOYERS_DATA_PATH'), newline='') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=',')
    for row in reader:
        employer_dict[row['employerId']] = 'Work'

# Merge the dictionaries
location_dict = {**restaurant_dict, **pub_dict,
                 **employer_dict, **apartment_dict}

end_date = datetime(2023,2,28)

# Read the data from the CSV file
with open(os.getenv('TRAVEL_JOURNAL_DATA_PATH'), newline='') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=',')
    print(next(reader).keys())
    # Process each row of data and aggregate it based on the specified columns
    for row in reader:
        start_time = datetime.fromisoformat(
            row['travelStartTime'][:-1])  # Parse the start time
        
        if start_time > end_date:
            continue

        # Calculate the month, day of the week, and portion of the day
        month = start_time.strftime('%B')
        day_of_week = start_time.strftime('%A')
        portion_of_day = 'Morning' if start_time.hour < 12 else (
            'Afternoon' if start_time.hour < 14 else ('Evening' if start_time.hour < 18 else 'Night'))
        purpose = row['purpose']  # Get the purpose of the commute
        # Get the start building ID
        start_building_id = row['travelStartLocationId']
        end_building_id = row['travelEndLocationId']  # Get the end building ID

        # Determine the type of location using the location_dict
        start_location_type = location_dict.get(start_building_id, 'Unknown')
        end_location_type = location_dict.get(end_building_id, 'Unknown')

        # Then, when incrementing the commute count:
        if end_location_type != 'Home':
            organized_data[month][day_of_week][portion_of_day][end_location_type] += 1

# Write the organized data to a CSV file
with open('../data/grouped_chart.csv', 'w', newline='') as csvfile:
    fieldnames = ['Month', 'Day of Week', 'Portion of Day',
                  'End Location Type', 'Total Commutes']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()

    # Write the organized data to the CSV file
    for month, day_data in organized_data.items():
        for day_of_week, portion_data in day_data.items():
            for portion_of_day, end_location_data in portion_data.items():
                for end_location_type, total_commutes in end_location_data.items():
                    writer.writerow({
                        'Month': month,
                        'Day of Week': day_of_week,
                        'Portion of Day': portion_of_day,
                        'End Location Type': end_location_type,
                        'Total Commutes': total_commutes
                    })

print('CSV file has been created: grouped_chart.csv')
