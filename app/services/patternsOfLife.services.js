import query from "./db.services.js";
import dedent from "dedent";

export async function totalCommutesByMonth() {
    return await query(`select * from TotalCommutesByMonth`);
}

export async function getTotalCommutesByPurpose(year, month, dayOfWeek) {
    return await query(dedent`
            select timeOfDay, purpose, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            group by timeOfDay, purpose
        `)
        .then(data => data
            .reduce((a, { timeOfDay, purpose, totalCommutes }) => ({
                ...a,
                [timeOfDay]: [...a[timeOfDay] || [], { purpose, totalCommutes }]
            }), {}));
}

export async function getTotalCommutesTimeOfDay(year, month, dayOfWeek, timeOfDay) {
    return await query(dedent`
            select purpose, travelEndLocationId as buildingId, endLocation as location, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and timeOfDay = '${timeOfDay}'
            group by purpose, travelEndLocationId
        `);
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