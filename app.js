const express = require('express');
const models = require('./models');
const responseTime = require('response-time');
const { logger } = require('./log');
const router = express.Router();
const app = express();

//default router
router.get('/', (req, res) => {
    res.send('Hello world!');
})

router.get('/articles/:id', async(req, res) => {
    try {
        const article_Data = await models.getArticle(parseInt(req.params.id));
        res.json({ error: false, message: 'success', data: article_Data });
    } catch (e) {
        res.json({ error: true, message: 'Error occurred during processing' });
        console.log(e);
    }
});

router.get('*', (req, res) => {
    res.send('404');
});
//url='localhost:port/articles/{id}'

app.use(async(req, res, next) => {
    logger.trace(`Received request: Method: ${req.method} url: ${req.hostname}${req.originalUrl} User-Agent: ${req.get("user-agent")} IP: ${req.ip}`);
    console.log("Method", req.method, "User-Agent", req.get("user-agent"));
    if (!await models.CheckPermission(req.ip)) {
        logger.warn("Server blocked request from ", req.ip, " -- too many requests");
        res.status(429).send('Too many requests - try again later');
        return;
    }
    next();
});

//服务端响应时间
app.use(responseTime((req, res, time) => {
    console.log("response-Time", time.toFixed(2));
    logger.trace(`${req.hostname}${req.originalUrl} response-Time: ${time.toFixed(2)}ms`);
}));



app.use('/', router);


app.listen(process.env.PORT || 3000, () => {
    console.log(`App is listening at ${process.env.PORT||3000}`);
});