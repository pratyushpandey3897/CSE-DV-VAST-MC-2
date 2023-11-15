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
    .get("/totalCommutesByPurpose/:year/:month/:dayOfWeek", async(req, res) => {
        res.json(await db.getTotalCommutesByPurpose(req.params.year, monthMap[req.params.month], weekdayMap[req.params.dayOfWeek]));
    })
    .get("/locations/:year/:month/:dayOfWeek/:timeOfDay", async(req, res) => {
        res.json(await db.getLocationsByTimeOfDay(req.params.year, req.params.month, req.params.dayOfWeek, req.params.timeOfDay));
    })
    .get("/map", async(_, res) => {
        res.json(await db.getMapGeoJson());
    });

export default router;