import express from 'express';
import * as db from '../services/patternsOfLife.services.js';

const router = express.Router()
    .get("/totalCommutesByMonth", async (_, res) => {
        res.json(await db.totalCommutesByMonth());
    })
    .get("/commutesByCommuteType/:year/:month/:dayOfWeek", async(req, res) => {
        res.json(await db.getTotalCommutesByPurpose(req.params.year, req.params.month, req.params.dayOfWeek));
    })
    .get("/commutesByLocation/:year/:month/:dayOfWeek/:timeOfDay", async(req, res) => {
        res.json(await db.getTotalCommutesTimeOfDay(req.params.year, req.params.month, req.params.dayOfWeek, req.params.timeOfDay));
    })
    .get("/locations/:year/:month/:dayOfWeek/:timeOfDay", async(req, res) => {
        res.json(await db.getLocationsByTimeOfDay(req.params.year, req.params.month, req.params.dayOfWeek, req.params.timeOfDay));
    });

export default router;