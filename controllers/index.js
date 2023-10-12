import express, { Router } from "express";
// eslint-disable-next-line no-unused-vars
import sql from "mssql";
import {checkThreshold} from "../services/linebot.js";
const router = Router();

router.use(express.json());

router.get("/records", async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const result = await pool.request().query('SELECT O3, CO, TEMP, RH, PM1_0, PM2_5, PM10, UP_DATE from Data');
        console.log(result);
        res.json(result.recordset)
    } catch (err) {
        console.error("Error querying Data table", err);
        res.status(500).send('Internal Server Error');
    }
});


router.post("/records", async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const newRecord = req.body;
        const query = `INSERT INTO Data (O3, CO, TEMP, RH, PM1_0, PM2_5, PM10, UP_EQU) VALUES (@O3, @CO, @TEMP, @RH, @PM1_0, @PM2_5, @PM10, @UP_EQU);`;
        const result = await pool.request()
            .input('O3', sql.Float, newRecord.O3)
            .input('CO', sql.Float, newRecord.CO)
            .input('TEMP',sql.Float, newRecord.TEMP)
            .input('RH',sql.Float, newRecord.RH)
            .input('PM1_0',sql.Int, newRecord.PM1_0)
            .input('PM2_5',sql.Int, newRecord.PM2_5)
            .input('PM10',sql.Int, newRecord.PM10)
            .input('UP_EQU',sql.NVarChar, newRecord.UP_EQU)
            .query(query);
        //console.log("Query Result: ", result); // 印出查詢結果，方便除錯
        checkThreshold(newRecord);

        res.json({ success: true, message: 'Insert successful' });
    } catch (err) {
        console.error('Error during insert', err);
        res.status(500).send('Internal Server Error');
    }
});


router.get("/records/all", async (req, res) => {
    try {
        const pool = req.app.locals.pool;
        const result = await pool.request().query('SELECT * FROM Data');
        console.log(result);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error querying Data table", err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
