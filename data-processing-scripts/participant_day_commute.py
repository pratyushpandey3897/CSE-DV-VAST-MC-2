import json
from datetime import datetime
from collections import Counter
# Load your JSON data
with open('../parsedData/commute_specifics.json', 'r') as f:
    print("here")
    data = json.load(f)

print("data loaded")
new_structure = {}

for month, weekdays in data.items():
    new_structure[month] = {}
    for weekday, times in weekdays.items():
        new_structure[month][weekday] = {}
        for time, places in times.items():
            for place, details in places.items():
                commutes = details.get('commute', [])
                for commute in commutes:
                    participant_id = commute['participantId']
                    date = datetime.strptime(commute['starttime'], "%Y-%m-%dT%H:%M:%S+00:00").date().isoformat()
                    if participant_id not in new_structure[month][weekday]:
                        new_structure[month][weekday][participant_id] = {}
                    if date not in new_structure[month][weekday][participant_id]:
                        new_structure[month][weekday][participant_id][date] = []
                    # Create a new dictionary with only the desired properties
                    new_commute = {
                        'end': commute['end'],
                        'moneydiff': commute['moneydiff'],
                        'starttime': commute['starttime'],
                        'endtime': commute['endtime']
                    }
                    new_structure[month][weekday][participant_id][date].append(new_commute)



for month, weekdays in new_structure.items():
    for weekday, participants in weekdays.items():
        # Count the number of commutes for each participant
        commute_counts = Counter({participant: sum(len(commutes) for commutes in dates.values()) for participant, dates in participants.items()})
        # Get the top 10 participants with the most commutes
        top_participants = [participant for participant, _ in commute_counts.most_common(10)]
        # Filter the participants dictionary to only include the top participants
        new_structure[month][weekday] = {participant: dates for participant, dates in participants.items() if participant in top_participants}
# Print the new structure
# print(json.dumps(new_structure, indent=4))
with open('../parsedData/particpiantDayActivity.json', 'w') as f:
    json.dump(new_structure, f, indent=4)