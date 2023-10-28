import query from './db.js';

export function getTotalCommutesByMonth() {
    return query(`select strftime('%Y-%m', travelStartTime) as month, count(*) as totalCommutes from TravelJournalCombined group by month`);
}