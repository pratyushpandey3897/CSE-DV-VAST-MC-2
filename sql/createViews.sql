DROP TABLE IF EXISTS TravelJournalWithTimeOfDayAndMonth;

CREATE TABLE TravelJournalWithTimeOfDayAndMonth AS
SELECT
    *,
    CASE
        WHEN strftime('%H', travelStartTime) >= '05' AND strftime('%H', travelStartTime) < '12' THEN 'morning'
        WHEN strftime('%H', travelStartTime) >= '12' AND strftime('%H', travelStartTime) < '14' THEN 'afternoon'
        WHEN strftime('%H', travelStartTime) >= '14' AND strftime('%H', travelStartTime) < '18' THEN 'evening'
        ELSE 'night' -- You can specify a default value if needed
    END AS timeOfDay,
    strftime('%Y-%m', travelStartTime) AS month
FROM
    TravelJournal;