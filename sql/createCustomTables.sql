DROP TABLE IF EXISTS TravelJournalCombined;
DROP TABLE IF EXISTS LocationCombined;

-- table to group all the locationIds together to combine with TravelJournal locationId columns
CREATE TABLE LocationCombined (
    locationId INTEGER PRIMARY KEY,
    locationType TEXT
);

-- combine all the locationIds
INSERT INTO LocationCombined (locationId, locationType)
SELECT apartmentId, 'apartment' FROM Apartments
UNION ALL
SELECT pubId, 'pub' FROM Pubs
UNION ALL
SELECT schoolId, 'school' FROM Schools
UNION ALL
SELECT restaurantId, 'restaurant' FROM Restaurants;

CREATE TABLE TravelJournalCombined AS
SELECT
    tj.*,
    CASE
        WHEN strftime('%H', travelStartTime) >= '05' AND strftime('%H', travelStartTime) < '12' THEN 'morning'
        WHEN strftime('%H', travelStartTime) >= '12' AND strftime('%H', travelStartTime) < '14' THEN 'afternoon'
        WHEN strftime('%H', travelStartTime) >= '14' AND strftime('%H', travelStartTime) < '18' THEN 'evening'
        ELSE 'night'
    END AS timeOfDay,
    strftime('%Y-%m', travelStartTime) AS month,
    cl1.locationType as startLocationType,
    cl2.locationType as endLocationType
FROM
    TravelJournal AS tj
LEFT JOIN 
    LocationCombined AS cl1
ON 
    tj.travelStartLocationId = cl1.LocationId
LEFT JOIN 
    LocationCombined AS cl2
ON 
    tj.travelEndLocationId = cl2.LocationId;

