import query from "./db.services.js";
import dedent from "dedent";

export async function totalCommutesByMonth() {
    return await query(`select month as Month, totalCommutes as 'Total Commutes' from TotalCommutesByMonth where year = '2022'`);
}

export async function getTotalCommutesByLocationType(year, month, dayOfWeek) {
    return await query(dedent`
            select timeOfDay, endLocationType, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            group by timeOfDay, endLocationType
        `)
        .then(data => data
            .map(function (row) {
                return {
                    "Portion of Day": row.timeOfDay,
                    "Total Commutes": row.totalCommutes,
                    "End Location Type": row.endLocationType
                }
            }));
}

export async function getTotalExpendituresByLocationId(year, month, dayOfWeek, timeOfDay) {
    return await query(dedent`
            select participantId, travelEndLocationId, travelStartTime, (startingBalance - endingBalance) as expenditure, 
            b.maxOccupancy, endLocationType
            from TravelJournalCombined t
            join (
                select restaurantId as buildingId, maxOccupancy from Restaurants
                union
                select pubId as buildingId, maxOccupancy from Pubs
                union
                select employerId as buildingId, maxOccupancy from Employers
            ) as b where b.buildingId = t.travelEndLocationId
            and t.year = '${year}'
            and t.month = '${month}' and t.dayOfWeek='${dayOfWeek}'
            and t.timeOfDay = '${timeOfDay}'
        `)
        .then(data => data
            .map(function (row) {
                return {
                    "participantId": row.participantId,
                    "commercialId": row.travelEndLocationId,
                    "start_time": row.travelStartTime,
                    "month": row.month,
                    "day_of_week": row.dayOfWeek,
                    "portion_of_day": row.timeOfDay,
                    "expenditures": row.expenditure,
                    "occupancy": row.maxOccupancy,
                    "buildingId": row.travelEndLocationId,
                    "commercialType": row.endLocationType
                }
            }));
}

export async function getLocationsByTimeOfDay(year, month, dayOfWeek, timeOfDay) {
    return await query(dedent`
            select endLocationId as locationId, endLocation as location, endLocationType as locationType, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and timeOfDay = '${timeOfDay}'
            group by endLocationId, endLocationType
            order by totalCommutes desc
        `)
        .then(data => data
            .filter(row => row.location != null)
            .map(row => {

                const coordinates = row.location.match(/([-+]?[0-9]*\.?[0-9]+) ([-+]?[0-9]*\.?[0-9]+)/g)?.map(pair => pair.split(' ').map(Number));

                // Create a GeoJSON feature for each item
                return {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: coordinates[0]
                    },
                    properties: {
                        locationId: row.locationId,
                        locationType: row.locationType,
                        totalCommutes: row.totalCommutes
                    }
                };
            }));
}

export async function getTotalCommutesByLocationId(year, month, dayOfWeek, timeOfDay) {
    return await query(dedent`
            select endLocationType, endLocationId, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and timeOfDay = '${timeOfDay}'
            group by endLocationType, endLocationId
        `)
        .then(data => data
            .filter(row => row.endLocationType != null)
            .reduce((acc, curr) => {
                if (!acc[curr.endLocationType]) {
                    acc[curr.endLocationType] = {};
                }
                acc[curr.endLocationType][curr.endLocationId] = curr.totalCommutes;
                return acc;
            }, {}));
}

export async function getMapGeoJson() {
    return await query(dedent`
            select * from Location;
        `)
        .then(data => data
            .map(item => {

                const coordinates = item.location.match(/([-+]?[0-9]*\.?[0-9]+) ([-+]?[0-9]*\.?[0-9]+)/g)?.map(pair => pair.split(' ').map(Number));

                // Ensure the polygon has at least 3 valid coordinates
                if (coordinates?.length >= 3) {
                    return {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: [coordinates]
                        },
                        properties: {
                            buildingId: item.buildingId,
                            buildingType: item.buildingType
                        }
                    };
                }

            }));
}