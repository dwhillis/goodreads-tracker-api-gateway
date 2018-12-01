const express = require('express');
const mustacheExpress = require('mustache-express');
const app = express();
const path = require('path');

const rp = require('request-promise');
const cheerio = require('cheerio');

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname);
const oneDay = 1000 * 60 * 60 * 24;

app.get('/:userId', (req, res) => {
    console.time('fetch');
    rp({
        uri: `https://www.goodreads.com/user/show/${req.params.userId}`,
        transform: (body) => {
            console.timeEnd('fetch');
            console.time('cheerio');
            console.log(body);
            return cheerio.load(body);
        },
        simple: false
    })
    .then(($) => {
        console.timeEnd('cheerio');
        const progressText = $('a[class=challengeBooksRead]').text();
        if (!progressText) {
            return;
        }
        console.log(progressText);
        let matches = /(\d+) of (\d+)/.exec(progressText);	
        console.log(matches[1], matches[2]);
        console.log(`${matches[1] / matches[2] * 100}%`);
        let completedCurrent = matches[1];
        let completedGoal = matches[2];
        let completedPercentage = completedCurrent / completedGoal;

        let now = new Date();
        let start = new Date(now.getFullYear(), 0, 0);
        let end = new Date(now.getFullYear(), 11, 31);
        let diff = now - start;
        let yearCurrent = Math.floor((now - start) / oneDay);
        let yearGoal = Math.floor((end - start) / oneDay);
        console.log(`${yearCurrent / yearGoal * 100}%`);	
        let yearPercentage = yearCurrent / yearGoal;

        const userName = $('h1[class=userProfileName]').text().trim();

        res.render('index', {yearPercentage, yearCurrent, yearGoal, completedPercentage, completedCurrent, completedGoal, userName});
    })
    .catch((err) => {
        console.error(err);
    });
});

module.exports = app;
