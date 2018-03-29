const express = require('express');
const mustacheExpress = require('mustache-express');
const app = express();
const path = require('path');

const rp = require('request-promise');
const cheerio = require('cheerio');
const options = {
  uri: 'https://www.goodreads.com/user/show/6940526',
  transform: function (body) {
    return cheerio.load(body);
  }
};

app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname);
const oneDay = 1000 * 60 * 60 * 24;

//const goodreads = require('goodreads-api-node');

/*
const credentials = {
    key: process.env.GOODREADS_KEY,
    secret: process.env.GOODREADS_SECRET
};

console.log(credentials);

const gr = goodreads(credentials);

*/
app.get('/', (req, res) => {
rp(options)
.then(($) => {
	const progressText = $('a[class=challengeBooksRead]').text();
console.log(progressText);
	let matches = /(\d+) of (\d+)/.exec(progressText);	
	console.log(matches[1], matches[2]);
	console.log(`${matches[1] / matches[2] * 100}%`);	
	let completedPercentage = matches[1] / matches[2];

	let now = new Date();
	let start = new Date(now.getFullYear(), 0, 0);
	let end = new Date(now.getFullYear(), 12, 31);
	let diff = now - start;
	let day = Math.floor((now - start) / oneDay);
	let endDay = Math.floor((end - start) / oneDay);
	console.log(`${day / endDay * 100}%`);	
	let yearPercentage = day / endDay;
	res.render('index', {yearPercentage, completedPercentage});
})
.catch(console.err);
});

app.listen(3000, () => {
    console.log('listening on port 3000');
});


