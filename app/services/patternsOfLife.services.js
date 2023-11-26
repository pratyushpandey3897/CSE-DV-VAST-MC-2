import query from "./db.services.js";
import dedent from "dedent";

const weekdayMap = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const monthMap = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  10: "October",
  11: "November",
  12: "December",
};

export async function totalCommutesByMonth() {
  return await query(
    `select month, totalCommutes from TotalCommutesByMonth where (year = '2022' or (year = '2023' and month in ('01', '02'))) order by month;`
  ).then((data) =>
    data.map((row) => {
      return {
        Month: monthMap[row.month],
        "Total Commutes": row.totalCommutes,
      };
    })
  );
}

export async function getTotalCommutesByWeekDay(year, month) {
  return await query(dedent`
            select dayOfWeek, count(*) as totalCommutes from TravelJournalCombined where year = '${year}' and month = '${month}'
            group by dayOfWeek order by dayOfWeek
        `).then((data) =>
    data.reduce((acc, curr) => {
      acc[weekdayMap[curr.dayOfWeek]] = curr.totalCommutes;
      return acc;
    }, {})
  );
}

export async function getTotalCommutesByLocationType(year, month, dayOfWeek) {
  return await query(dedent`
            select timeOfDay, endLocationType, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and endLocationType in ("Pub", "Workplace", "Restaurant")
            group by timeOfDay, endLocationType
        `).then((data) =>
    data.map(function (row) {
      return {
        "Portion of Day": row.timeOfDay,
        "Total Commutes": row.totalCommutes,
        "End Location Type": row.endLocationType,
      };
    })
  );
}

export async function getTotalExpendituresByLocationId(
  year,
  month,
  dayOfWeek,
  timeOfDay,
  locationId
) {
  return await query(dedent`
            select participantId, travelEndLocationId, travelEndTime, 
            abs(startingBalance - endingBalance) as expenditure, endLocationType
            from TravelJournalCombined t
            join (
                select restaurantId as buildingId from Restaurants
                union
                select pubId as buildingId  from Pubs
                union
                select employerId as buildingId  from Employers
            ) as b where b.buildingId = t.travelEndLocationId
            and t.year = '${year}'
            and t.month = '${month}' and t.dayOfWeek='${dayOfWeek}'
            and t.timeOfDay = '${timeOfDay}'
            and t.travelEndLocationId = ${locationId}
        `).then((data) =>
    data.map((row) => {
      return {
        total_expenditure: row.expenditure,
        time: row.travelEndTime,
      };
    })
  );
}

export async function getLocationsByTimeOfDay(
  year,
  month,
  dayOfWeek,
  timeOfDay
) {
  return await query(dedent`
            select endLocationId as locationId, endLocation as location, endLocationType as locationType, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and timeOfDay = '${timeOfDay}'
            group by endLocationId, endLocationType
            order by totalCommutes desc
        `).then((data) =>
    data
      .filter((row) => row.location != null)
      .map((row) => {
        const coordinates = row.location
          .match(/([-+]?[0-9]*\.?[0-9]+) ([-+]?[0-9]*\.?[0-9]+)/g) // parse coordinates from string
          ?.map((pair) => pair.split(" ").map(Number)); // split into lat and long

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: coordinates[0],
          },
          properties: {
            locationId: row.locationId,
            locationType: row.locationType,
            totalCommutes: row.totalCommutes,
          },
        };
      })
  );
}

export async function getStartLocationsForEndLocationId(
  year,
  month,
  dayOfWeek,
  timeOfDay,
  endLocationId
) {
  return await query(dedent`
            select startLocationId as locationId, startLocation as location, 
            startLocationType as locationType, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and timeOfDay = '${timeOfDay}'
            and endLocationId = ${endLocationId}
            group by startLocationId
            order by totalCommutes desc
        `).then((data) =>
    data
      .filter((row) => row.location != null)
      .map((row) => {
        const coordinates = row.location
          .match(/([-+]?[0-9]*\.?[0-9]+) ([-+]?[0-9]*\.?[0-9]+)/g) // parse coordinates from string
          ?.map((pair) => pair.split(" ").map(Number)); // split into lat and long

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: coordinates[0],
          },
          properties: {
            locationId: row.locationId,
            locationType: row.locationType,
            totalCommutes: row.totalCommutes,
          },
        };
      })
  );
}

export async function getTotalCommutesByLocationId(
  year,
  month,
  dayOfWeek,
  timeOfDay
) {
  return await query(dedent`
            select endLocationType, endLocationId, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and timeOfDay = '${timeOfDay}'
            and endLocationType in ('Restaurant', 'Pub', 'Workplace')
            group by endLocationType, endLocationId
        `).then((data) =>
    data
      .filter((row) => row.endLocationType != null)
      .reduce((acc, curr) => {
        if (!acc[curr.endLocationType]) {
          acc[curr.endLocationType] = {};
        }
        acc[curr.endLocationType][curr.endLocationId] = curr.totalCommutes;
        return acc;
      }, {})
  );
}

export async function getMapGeoJson() {
  return await query(dedent`
            select * from Location;
        `).then((data) =>
    data.map((item) => {
      const coordinates = item.location
        .match(/([-+]?[0-9]*\.?[0-9]+) ([-+]?[0-9]*\.?[0-9]+)/g)
        ?.map((pair) => pair.split(" ").map(Number));

      // Ensure the polygon has at least 3 valid coordinates
      if (coordinates?.length >= 3) {
        return {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coordinates],
          },
          properties: {
            buildingId: item.buildingId,
            buildingType: item.buildingType,
          },
        };
      }
    })
  );
}

export async function getTop10Participants(year, month, dayOfWeek) {
  return await query(dedent`
            select t.*, strftime('%Y-%m-%d', t.travelStartTime) as date
            from TravelJournalCombined t
            join (select participantId, count(*) as totalCommutes
            from TravelJournalCombined where year = '${year}'
            and month = '${month}' and dayOfWeek='${dayOfWeek}'
            and startLocationId is not null and endLocationId is not null 
            group by participantId
            order by totalCommutes desc
            limit 10) p on p.participantId = t.participantId
            where t.year = '${year}'
            and t.month = '${month}' and t.dayOfWeek='${dayOfWeek}'
            order by t.participantId, t.travelStartTime
        `).then((data) =>
    data.reduce((acc, curr) => {
      if (!acc[curr.participantId]) {
        acc[curr.participantId] = {};
      }
      if (!acc[curr.participantId][curr.date]) {
        acc[curr.participantId][curr.date] = {
          Morning: [],
          Afternoon: [],
          Evening: [],
          Night: [],
        };
      }
      // if (!acc[curr.participantId][curr.date][curr.timeOfDay]) {
      //   acc[curr.participantId][curr.date][curr.timeOfDay] = [];
      // }
      acc[curr.participantId][curr.date][curr.timeOfDay].push({
        end: {
          pointId: curr.endLocationId,
          type: curr.endLocationType,
          hourlyCost: curr.hourlyCost,
          maxOccupancy: curr.maxOccupancy,
          location: curr.endLocation,
        },
        moneydiff: curr.startingBalance - curr.endingBalance,
        starttime: curr.travelStartTime,
        endtime: curr.travelEndTime,
      });
      return acc;
    }, {})
  );
}
