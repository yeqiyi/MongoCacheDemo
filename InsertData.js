const { MongoClient } = require('mongodb');
const url = 'mongodb://127.0.0.1:27017/articles';
const client = new MongoClient(url);

var dbo = null;

client.connect((err, db) => {
    if (err) {
        console.log(err);
        process.exit(0);
    }
    dbo = db.db('articles');

    console.log('connected to the database');

    insertData();
});
async function insertData() {
    var data = [];
    for (let i = 1; i <= 1000; i++) {
        var obj = {
            id: i,
            context: `This is article${i}, balabala`
        }
        data.push(obj);
    }
    await dbo.collection('articles').insertMany(data);

    client.close();
}