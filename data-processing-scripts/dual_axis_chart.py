import csv
import os
from datetime import datetime
from collections import defaultdict
import pandas as pd

PubsDataPath = '/Users/PriyankaPrabhu/Documents/ASU/DV/Project/VAST-Challenge-2022/Datasets/Attributes/Pubs.csv'
restaurantsDataPath = '/Users/PriyankaPrabhu/Documents/ASU/DV/Project/VAST-Challenge-2022/Datasets/Attributes/Restaurants.csv'
travelDataPath = '/Users/PriyankaPrabhu/Documents/ASU/DV/Project/VAST-Challenge-2022/Datasets/Journals/TravelJournal.csv'
outputPath = '/Users/PriyankaPrabhu/Documents/ASU/DV/Project/CSE-DV-VAST-MC-2/data/commercial_expenditures_occupancy.csv'

cols = ['pubId', 'buildingId']
# Read the data from the pubs CSV file
pubs_df = pd.read_csv(PubsDataPath, usecols=cols)
pubs_df['commercialType'] = 'Pub'
pubs_df.rename(columns={'pubId': 'commercialId'}, inplace=True)

# Specify the columns you want to load
cols = ['restaurantId', 'buildingId']
# Read the data from the restaurants CSV file
restaurants_df = pd.read_csv(restaurantsDataPath, usecols=cols)
#print(restaurants_df)
restaurants_df['commercialType'] = 'Restaurant'
restaurants_df.rename(columns={'restaurantId': 'commercialId'}, inplace=True)
# Concatenate the two dataframes

combined_df = pd.concat([pubs_df, restaurants_df], ignore_index=True)
#print(combined_df)

cols = ['participantId', 'travelEndLocationId', 'checkInTime', 'startingBalance', 'endingBalance']
travel_journal_df = pd.read_csv(travelDataPath, usecols=cols)
# Filter rows where travelEndLocationId is in combined_df's commercialId
travel_journal_df = travel_journal_df[travel_journal_df['travelEndLocationId'].isin(combined_df['commercialId'])]
# Process the columns
travel_journal_df['start_time'] = pd.to_datetime(travel_journal_df['checkInTime'].str[:-1])
travel_journal_df['month'] = travel_journal_df['start_time'].dt.strftime('%B')
travel_journal_df['day_of_week'] = travel_journal_df['start_time'].dt.strftime('%A')
travel_journal_df['portion_of_day'] = pd.cut(travel_journal_df['start_time'].dt.hour, bins=[0,12,14,18,24], labels=['Morning', 'Afternoon', 'Evening', 'Night'], include_lowest=True)
# Rename the columns
travel_journal_df.rename(columns={'travelEndLocationId': 'commercialId'}, inplace=True)
travel_journal_df['balance_difference'] = travel_journal_df['startingBalance'] - travel_journal_df['endingBalance']
travel_journal_df['occupancy'] = travel_journal_df.groupby('commercialId')['participantId'].transform('count')
travel_journal_df.drop(['startingBalance', 'endingBalance', 'checkInTime'], axis=1, inplace=True)
#print(travel_journal_df)

merged_df = pd.merge(travel_journal_df, combined_df, on='commercialId', how='inner')
#filtered_df = merged_df[merged_df['commercialType'] == 'Restaurant']
print(merged_df)
merged_df.to_csv(outputPath, index=False)
