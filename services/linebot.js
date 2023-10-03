import {CronJob} from "cron";
import client from "../infrastructure/linebot.js";
import config from '../infrastructure/SQLconfig.js';
import sql from "mssql";
import moment from "moment";

async function autoUpload(time, userID = null) {
    try {
        const pool = await sql.connect(config);
        const query = `
            SELECT *
            FROM Data
            inner join Access on Data.UP_EQU = Access.USER_EQU
            WHERE UP_DATE BETWEEN @startDate AND @endDate
            AND (@userID IS NULL OR Access.USER_ID = @userID)
            ORDER BY UP_DATE DESC;`
        const result = await new Promise((resolve, reject) => {
            pool.request()
                .input('startDate', sql.DateTime, moment(time).subtract(10, 'minutes').toDate())
                .input('endDate', sql.DateTime, time)
                .input('userID', sql.Char, userID)
                .query(query, (err, result) => {
                    if (err) {
                        reject(err);
                        console.log("Query Result: ", err); // 印出查詢結果，方便除錯
                    } else {
                        resolve(result);
                        //console.log("Query Result: ", result); // 印出查詢結果，方便除錯
                    }
                });
        });
        return result;
    } catch (error) {
        console.error("Error updating user", error);
    } finally {
        sql.close();
    }
}


const job = new CronJob(
    '0 0 * * * *',
    function () {
        try {
            const currentTime = new Date();
            autoUpload(currentTime, null).then((result) => {
                const processUserEque = {};
                for (const row of result.recordset) {
                    if (!processUserEque[row.USER_EQU] && row.USER_ID !== null) {
                        const messageText = [];
                        messageText.push(
                            `CL2: ${row.CL2}`,
                            `CO: ${row.CO}`,
                            `Temperature: ${row.TEMP}`,
                            `Humidity: ${row.RH}`,
                            `PM1.0: ${row.PM1_0}`,
                            `PM2.5: ${row.PM2_5}`,
                            `PM10: ${row.PM10}`,
                            `Time: ${moment(row.UP_DATE).format('YYYY-MM-DD HH:mm')}`);
                        const MergedMessageText = messageText.join('\n');
                        client.pushMessage(row.USER_ID, {
                            type: 'text',
                            text: MergedMessageText
                        })
                    }
                }
            });
            console.log('You will see this message every 1 hors');
        } catch (error) {
            console.error("Error Cronjob", error);
        }
    },
    null,
    true,
    'Asia/Taipei'
);


export async function handleArduino(event) {
    const echo = {type: 'text', text: event.message.text};
    try {
        const pool = await sql.connect(config);
        const query = `UPDATE Access
                       SET USER_ID = @UP_ID
                       WHERE USER_EQU = @UP_EQU;`
        const result = await new Promise((resolve, reject) => {
            pool.request()
                .input('UP_EQU', sql.Char, event.message.text)
                .input('UP_ID', sql.Char, event.source.userId)
                .query(query, (err, result) => {
                    if (err) {
                        reject(err);
                        echo.text = '憑證上傳失敗';
                    } else {
                        if (result.rowsAffected[0] === 0) {
                            echo.text = '憑證上傳失敗';
                        } else {
                            echo.text = '憑證上傳成功';
                        }
                        resolve(result);
                    }
                });
        });
        console.log("Update successful", result);
    } catch (error) {
        console.error("Error updating user", error);
    } finally {
        sql.close();
    }
    return echo;
}


export async function query(event) {
    try {
        const currentTime = new Date();
        const row = await autoUpload(currentTime, event.source.userId);
        console.log(row);
        if (row.rowsAffected > 0) {
            const messageText = [];
            messageText.push(
                `CL2: ${row.recordset[0].CL2}`,
                `CO: ${row.recordset[0].CO}`,
                `Temperature: ${row.recordset[0].TEMP}`,
                `Humidity: ${row.recordset[0].RH}`,
                `PM1.0: ${row.recordset[0].PM1_0}`,
                `PM2.5: ${row.recordset[0].PM2_5}`,
                `PM10: ${row.recordset[0].PM10}`,
                `Time: ${moment(row.recordset[0].UP_DATE).format('YYYY-MM-DD HH:mm')}`);

            const MergedMessageText = messageText.join('\n');
            return {type: 'text', text: MergedMessageText};
        } else {
            return {type: 'text', text: '查無資料'};
        }


    } catch (error) {
        console.error("Error Cronjob", error);
        return {type: 'text', text: '查詢錯誤'};
    }
}


export async function checkThreshold(event) {
    try {
        const thresholds = {
            CO: 10,
            CL2: 10,
            TEMP: 10,
            RH: 10,
            PM1_0: 10,
            PM2_5: 10,
            PM10: 10,
        };

        let threshold = {};

        for (const property in thresholds) {
            if (event[property] > thresholds[property]) {
                threshold[property] = event[property];
            }
        }
        if (threshold !== {}){
            const pool = await sql.connect(config);
            const query = `SELECT USER_ID FROM Access WHERE USER_EQU = @UP_EQU ;`
            const result = await new Promise((resolve, reject) => {
                pool.request()
                    .input('UP_EQU', sql.Char, event.UP_EQU)
                    .query(query, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
            });
            const message = "以下檢測數值超標：\n";
            threshold.Time = moment(new Date()).format('YYYY-MM-DD HH:mm');
            const thresholdString = Object.entries(threshold)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
            client.pushMessage(result.recordset[0].USER_ID, {
                type: 'text',
                text: message + thresholdString
            });

        }
        console.log('Thresholds:', threshold);

    } catch (error) {
        console.error("Error checkThreshold", error);
    } finally {
    sql.close();
    }
}


export function handleText(event) {
    return {type: 'text', text: event.message.text};
}