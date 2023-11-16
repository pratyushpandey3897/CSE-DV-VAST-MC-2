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
            select distinct endLocation as location, endLocationType as locationType
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and timeOfDay = '${timeOfDay}'
        `)
        .then(data => data
            .filter(row => row.location != null)
            .map(row => {

                const coordinates = row.location.match(/\(([^)]+)\)/)[1].split(' ');
                const longitude = parseFloat(coordinates[0]);
                const latitude = parseFloat(coordinates[1]);

                // Create a GeoJSON feature for each item
                return {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    properties: {
                        locationType: row.locationType
                    }
                };
            }));
}

export async function getMapGeoJson() {
    return await query(dedent`
            select b.buildingId as buildingId, b.location as location, l.buildingType as buildingType 
            from Buildings b left join Location l where l.buildingId = b.buildingId
        `)
        .then(data => data
            .map(item => {

                const coordinates = item.location.match(/([-+]?[0-9]*\.?[0-9]+) ([-+]?[0-9]*\.?[0-9]+)/g);

                if (!coordinates) {
                    return null;
                }

                const polygonCoordinates = coordinates.map(pair => {
                    const [lon, lat] = pair.split(' ').map(Number);
                    return [lon, lat];
                });

                // Ensure the polygon has at least 3 valid coordinates
                if (polygonCoordinates.length >= 3) {
                    return {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: [polygonCoordinates]
                        },
                        properties: {
                            buildingId: item.buildingId,
                            buildingType: item.buildingType
                        }
                    };
                }

            }));
}