const express = require('express');
const router = express.Router();
const secured = require('../middleware/secured');

const axios = require('axios');
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const he = require('he');
const parseString = require('xml2js').parseString;

const myCredentials = {
  key: process.env.KEY,
  secret: process.env.SECRET
};
 
const oneDay = 1000 * 60 * 60 * 24;

const data = async (req, res) => {
    const userDetails = await documentClient.get({
        TableName: 'goodreads-tracker',
        Key: {
            'userId': req.user.id
        }
    }).promise();
    console.log(userDetails);
    req.params.userId = userDetails.Item.goodreadsUserId;
    try {
        console.log(`https://www.goodreads.com/review/list/${req.params.userId}.xml?v=2&sort=date_updated&shelf=read&page=1&per_page=100&key=${myCredentials.key}`);
        let response = await axios({
            method: 'get',
            url: `https://www.goodreads.com/review/list/${req.params.userId}.xml?v=2&sort=date_updated&shelf=read&page=1&per_page=100&key=${myCredentials.key}`,
            responseType: 'text'
        });

        let now = new Date();
        let start = new Date(now.getFullYear(), 0, 1);
        let end = new Date(now.getFullYear(), 11, 31);
        parseString(response.data, (err, result) => {
            let yearBooks = result.GoodreadsResponse.reviews[0].review
            .map((review) => {
                return {
                    id: review.book[0].id[0]._,
                    title: he.decode(review.book[0].title_without_series[0]),
                    read: new Date(review.read_at),
                    pages: review.book[0].num_pages[0]
                };
            })
            .filter((book) => book.read > start && book.read <= end);
            console.log(yearBooks);
            const yearCurrent = Math.floor((now - start) / oneDay);
            const completedCurrent = yearBooks.length;
            const yearGoal = Math.floor((end - start) / oneDay) + 1;
            const completedGoal = 40;
            const data = {
                diff: now - start,
                yearCurrent: yearCurrent,
                yearGoal: yearGoal,
                yearPercentage: yearCurrent / yearGoal,
                completedCurrent: completedCurrent,
                completedGoal: completedGoal,
                completedPercentage: completedCurrent / completedGoal,
                userName: req.user.displayName,
                picture: req.user.picture,
                yearPages: yearBooks.reduce((sum, val) => sum + Number(val.pages), 0)
            };
            res.json(data);
        });
    }
    catch(err) {
        console.log(err.message);
        res.status(500).end();
    }
};

const getConfig = async (req, res) => {
    req.body.userId = req.user.id;
    const config = await documentClient.get({
        TableName: 'goodreads-tracker',
        Key: {
            'userId': req.user.id
        }
    }).promise();
    res.json(config.Item);
};

const saveConfig = async (req, res) => {
    req.body.userId = req.user.id;
    console.log(req.body);
    await documentClient.update({
        TableName: 'goodreads-tracker',
        Key: {
            'userId': req.user.id
        },
        UpdateExpression: 'set #categories = :categories',
        ExpressionAttributeNames: { '#categories': 'categories' },
        ExpressionAttributeValues: {
            ':categories': req.body.categories || []
        }
    }).promise();
    res.end();
};

router.get('/data', secured(), data);
router.get('/config', secured(), getConfig);
router.put('/config', secured(), saveConfig);

module.exports = router;
