-- Create a view combining location and locationTypes of start and end locations with TravelJournal columns
CREATE VIEW TravelJournalCombined AS
SELECT
    tj.*,
    l1.buildingId as startLocationId,
    l2.buildingId as endLocationId,
    l1.location as startLocation,
    l2.location as endLocation,
    l1.buildingType as startLocationType,
    l2.buildingType as endLocationType
FROM TravelJournal AS tj
LEFT JOIN Location AS l1
    ON tj.travelStartLocationId = l1.buildingId
LEFT JOIN Location AS l2
    ON tj.travelEndLocationId = l2.buildingId;

-- Create a view of total commutes by month
CREATE VIEW TotalCommutesByMonth AS
SELECT year, month, COUNT(*) AS totalCommutes 
    FROM TravelJournal GROUP BY year, month