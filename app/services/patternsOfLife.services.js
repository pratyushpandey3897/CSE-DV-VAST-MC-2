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
            select purpose, travelEndLocationId as buildingId, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and timeOfDay = '${timeOfDay}'
            group by purpose, travelEndLocationId
        `)
        .then(data => data
            .reduce((a, { purpose, buildingId, totalCommutes }) => ({
                ...a,
                [purpose]: [...a[purpose] || [], { buildingId, totalCommutes }]
            }), {}));
}

export async function getLocationsByTimeOfDay(year, month, dayOfWeek, timeOfDay) {
    return await query(dedent`
            select endLocation as location, endLocationType as locationType
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and timeOfDay = '${timeOfDay}'
        `);
}