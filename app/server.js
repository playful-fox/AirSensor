import controllers from '../controllers/index.js';
import linebotRoutes from '../controllers/linebot.js';
import express from 'express';
import viteExpress from 'vite-express';
import sql from 'mssql';
import '../services/line-bot.js';
import config from '../infrastructure/SQLconfig.js';
const app = express();


sql.connect(config).then(pool => {
    console.log('Connected to MSSQL');

    app.locals.pool = pool;

    app.use('/api', controllers);
    app.use('/apiLinebot', linebotRoutes);

    const server = app.listen(3022, () => {
        console.log('Server is running on port 3022');
    });

    viteExpress.bind(app, server);
}).catch(err => {
    console.error('Connection Failed', err);
});


