import json
from pymongo import MongoClient

# Load JSON data from a file
with open('../parsedData/commute_specifics.json', 'r') as file:
    data = json.load(file)

# Connect to MongoDB Atlas
client = MongoClient("mongodb+srv://csedvmc2team:pppasr@cluster0.osfz3hb.mongodb.net/?retryWrites=true&w=majority")

# Select the database
db = client['VASTChallenge2021MC2']

# Select the collection
collection = db['CommuteSpecifics']

# Get the total number of items
# Get the total number of items
collection.insert_one(data)

print("Data inserted successfully.")