const express = require('express');
const router = express.Router();
const secured = require('../middleware/secured');

const icon = (req, res) => {
   res.sendFile(__dirname + '/favicon.ico');
};
const mainPage = (req, res) => {
   res.sendFile(__dirname + '/index.html');
};

router.get('/favicon.ico', icon);
router.get('/', secured(), mainPage);
router.get('/:userId', secured(), mainPage);

module.exports = router;
