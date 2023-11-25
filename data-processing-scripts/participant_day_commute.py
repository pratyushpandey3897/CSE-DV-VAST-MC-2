import json
from datetime import datetime
from collections import Counter
# Load your JSON data
with open('./parsedData/commute_specifics.json', 'r') as f:
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
                    endTimeHour = datetime.strptime(commute['endtime'], "%Y-%m-%dT%H:%M:%S+00:00").hour
                    tod = 'night'
                    if endTimeHour <12:
                        tod = "morning"
                    elif endTimeHour < 16:
                        tod = "afternoon"
                    elif endTimeHour < 19:
                        tod = "evening"
                    else:
                        tod = "night"
                    if participant_id not in new_structure[month][weekday]:
                        new_structure[month][weekday][participant_id] = {}
                    if date not in new_structure[month][weekday][participant_id]:
                            new_structure[month][weekday][participant_id][date] = {}
                            new_structure[month][weekday][participant_id][date]["morning"] = []
                            new_structure[month][weekday][participant_id][date]["afternoon"] = []
                            new_structure[month][weekday][participant_id][date]["evening"] = []
                            new_structure[month][weekday][participant_id][date]["night"] = []
                        
                    # Create a new dictionary with only the desired properties
                    new_commute = {
                        'end': commute['end'],
                        'moneydiff': commute['moneydiff'],
                        'starttime': commute['starttime'],
                        'endtime': commute['endtime']
                    }
                    new_structure[month][weekday][participant_id][date][tod].append(new_commute)



for month, weekdays in new_structure.items():
    for weekday, participants in weekdays.items():
        commute_counts = {}
        for participant in participants:
            commute_counts[participant] = 0
            for date in participants[participant]:
                for tod in participants[participant][date]:
                    commute_counts[participant] += len(participants[participant][date][tod])
                
        # Count the number of commutes for each participant
        #commute_counts = Counter({participant: sum(len(commutes) for commutes in participants.values()) for participant, dates  in participants.items()})
        # Get the top 10 participants with the most commutes
        # top_participants = [participant for participant, _ in commute_counts.most_common(10)]
        top_10_participants = dict(sorted(commute_counts.items(), key=lambda item: item[1], reverse=True)[:10])
        print(top_10_participants)
        # new_structure[month][weekday] = {participant: dates for participant, dates  in participants.items() if participant in top_10_participants}

        # Filter the participants dictionary to only include the top participants
        #new_structure[month][weekday]p = {participant: dates for participant, dates in participants.items() if participant in top_participants}
# Print the new structure
# print(json.dumps(new_structure, indent=4))
# with open('./parsedData/particpiantDayActivity.json', 'w') as f:
#     json.dump(new_structure, f, indent=4)
print("All done")