import express from 'express';
import * as db from '../services/patternsOfLife.services.js';

const monthMap = {
    "January": "01",
    "February": "02",
    "March": "03",
    "April": "04",
    "May": "05",
    "June": "06",
    "July": "07",
    "August": "08",
    "September": "09",
    "October": "10",
    "November": "11",
    "December": "12"
};

// create a object with key as weekday and value as numeric string of the weekday with sunday as 0
const weekdayMap = {
    "Sunday": "0",
    "Monday": "1",
    "Tuesday": "2",
    "Wednesday": "3",
    "Thursday": "4",
    "Friday": "5",
    "Saturday": "6"
};

const router = express.Router()
    .get("/totalCommutesByMonth", async (_, res) => {
        res.json(await db.totalCommutesByMonth());
    })
    .get("/totalCommutesByLocationType/:year/:month/:dayOfWeek", async (req, res) => {
        res.json(await db.getTotalCommutesByLocationType(req.params.year, monthMap[req.params.month], weekdayMap[req.params.dayOfWeek]));
    })
    .get("/totalCommutesByLocationId/:year/:month/:dayOfWeek/:timeOfDay", async (req, res) => {
        res.json(await db.getTotalCommutesByLocationId(req.params.year, monthMap[req.params.month], weekdayMap[req.params.dayOfWeek], req.params.timeOfDay));
    })
    .get("/startLocationsByEndLocationId/:year/:month/:dayOfWeek/:timeOfDay/:endLocationId", async (req, res) => {
        res.json(await db.getStartLocationsForEndLocationId(req.params.year, monthMap[req.params.month], weekdayMap[req.params.dayOfWeek], req.params.timeOfDay, req.params.endLocationId));
    })
    .get("/totalExpendituresByLocationId/:year/:month/:dayOfWeek/:timeOfDay/:locationId", async (req, res) => {
        res.json(await db.getTotalExpendituresByLocationId(req.params.year, monthMap[req.params.month], weekdayMap[req.params.dayOfWeek], req.params.timeOfDay, req.params.locationId));
    })
    .get("/locations/:year/:month/:dayOfWeek/:timeOfDay", async (req, res) => {
        res.json(await db.getLocationsByTimeOfDay(req.params.year, monthMap[req.params.month], weekdayMap[req.params.dayOfWeek], req.params.timeOfDay));
    })
    .get("/totalCommutesByWeekDay/:year/:month", async (req, res) => {
        res.json(await db.getTotalCommutesByWeekDay(req.params.year, monthMap[req.params.month]));
    })
    .get("/map", async (_, res) => {
        res.json(await db.getMapGeoJson());
    })
    .get("/top10Participants/:year/:month/:dayOfWeek", async (req, res) => {
        res.json(await db.getTop10Participants(req.params.year, monthMap[req.params.month], weekdayMap[req.params.dayOfWeek]));
    });

export default router;