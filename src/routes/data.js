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
    req.params.userId = 6940526;
    console.log(req.params.userId);
    try {
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
            let diff = now - start;
            let yearCurrent = Math.floor((now - start) / oneDay);
            let yearGoal = Math.floor((end - start) / oneDay) + 1;
            let yearPercentage = yearCurrent / yearGoal;
            let completedCurrent = yearBooks.length;
            let completedGoal = 40;
            let completedPercentage = completedCurrent / completedGoal;
            let userName = req.user.displayName;
            let picture = req.user.picture;
            let yearPages = yearBooks.reduce((sum, val) => sum + Number(val.pages), 0);
            res.json({yearPercentage, yearCurrent, yearGoal, yearPages, completedPercentage, completedCurrent, completedGoal, userName, picture, yearBooks});
        });
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }
};

router.get('/data', secured(), data);

module.exports = router;
