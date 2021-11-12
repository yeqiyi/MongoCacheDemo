const { MongoClient } = require('mongodb');
const { logger } = require('./log')
const url = 'mongodb://mongodb:27017/articles';
const client = new MongoClient(url);
const Redis = require('ioredis');
const redisClient = new Redis({
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || 'redis',
    family: 4,
    db: 0,
});
const EXPIRE_SECOND = 10 //每个IP访问记录的保存时间
const MAX_ACCESS = 5 //每个IP限制访问次数
const BLOCK_SECOND = 3600 //关小黑屋1h   
const BLOCK_SUFFIX = '-blocked' //屏蔽后缀

var dbo = null;

client.connect((err, db) => {
    if (err) {
        process.exit(0);
    }
    dbo = db.db('articles');
    console.log('connected to the database');
    logger.trace('Mongodb: Connected to the database');
});

redisClient.on('connect', () => {
    console.log('Redis is ready to accept connections');
})


function getArticle(id) {
    return new Promise((resolve, reject) => {
        redisClient.get(id, (err, reply) => {
            if (err) {
                console.log(err);
            } else if (reply) {
                //缓存命中
                resolve(reply);
            } else {
                //缓存未命中
                dbo.collection('articles').find({
                    id: id
                }).toArray((err, article_data) => {
                    if (err) {
                        logger.error('Redis :', err);
                        return reject(err);
                    }
                    if (article_data.length > 0) {
                        //写入缓存
                        redisClient.set(id, JSON.stringify(article_data));
                        console.log('get ', redis.get(id));
                    }
                    resolve(article_data);
                });

            }
        })
    });
}

async function isBlocked(ip) {
    return (await redisClient.get(ip + BLOCK_SUFFIX)) > 0;
}

async function isOverLimit(ip) {
    var v;
    try {
        v = await redisClient.incr(ip);
    } catch (e) {
        console.log(e);
        logger.error('Redis: Redis: OverLimit(could not increment key)');
        throw e;
    }
    console.log(`IP: ${ip} has access ${v} times`);
    await redisClient.expire(ip, EXPIRE_SECOND);
    if (v > MAX_ACCESS) {
        return true;
    }
    return false;
}

async function DoBLOCK(ip) {
    await redisClient.set(ip + BLOCK_SUFFIX, 1, 'ex', BLOCK_SECOND);
}

async function CheckPermission(ip) {
    console.log('check ', ip);
    //console.log(redis);
    if (await isBlocked(ip)) {
        console.log('isBlocked');
        return false;
    }

    if (await isOverLimit(ip)) {
        console.log('isOverLimit');
        try {
            await DoBLOCK(ip);
        } catch (e) {
            logger.error('Redis: executed doBlock err->', e);
        }
        return false;
    }
    return true;
}

module.exports = {
    getArticle: getArticle,
    CheckPermission: CheckPermission,
};