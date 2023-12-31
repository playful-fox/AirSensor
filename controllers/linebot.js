import { Router } from "express";
import client from "../infrastructure/linebot.js";
import {middleware} from "@line/bot-sdk";
import { config as configLinebot} from "../infrastructure/linebot.js";
import {handleArduino, query} from "../services/linebot.js";
const router = Router();


router.use(middleware(configLinebot));

router.post('/callback', (req, res) => {

    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

// event handler
async function handleEvent(event) {
    try {
        let message;
        if (event.type !== 'message' || event.message.type !== 'text') {
            // ignore non-text-message event
            return Promise.resolve(null);
        }


        if (event.message.text.match(/[A-Z]{3}-[A-Z0-9]{6}-[A-Z]{3}/)) {
            message = await handleArduino(event);
        }
        else if (event.message.text === 'Q' || event.message.text === 'q') {
            message =  await query(event);
        }
        else {
            return Promise.resolve(null);
        }
        // use reply API
        return client.replyMessage(event.replyToken, message);
    } catch (error) {
        console.error("Error handleEvent", error);
    }
}


export default router;
