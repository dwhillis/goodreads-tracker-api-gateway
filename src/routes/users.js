const express = require('express');
const secured = require('../middleware/secured');
const router = express.Router();

router.get('/user', secured(), (req, res, next) => {
    const { _raw, _json, ...userProfile } = req.user;
    res.json(userProfile);
});

module.exports = router;
