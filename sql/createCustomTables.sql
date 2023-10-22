DROP TABLE IF EXISTS TravelJournalCombined;
DROP TABLE IF EXISTS LocationCombined;

CREATE TABLE LocationCombined (
    locationId INTEGER PRIMARY KEY,
    locationType TEXT
);

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
        ELSE 'night' -- You can specify a default value if needed
    END AS timeOfDay,
    strftime('%Y-%m', travelStartTime) AS month,
    cl.locationType
FROM
    TravelJournal AS tj
LEFT JOIN
    LocationCombined AS cl
ON
    tj.travelStartLocationId = cl.locationId;
