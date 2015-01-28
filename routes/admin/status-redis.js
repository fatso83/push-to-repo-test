var express = require('express');
var router = express.Router();
var cors = require('cors');

var log4js = require('log4js');
var logger = log4js.getLogger('Status redis');

var redisCache = require('../../modules/caching/redis-cache');
var utils = require('../../modules/utils');

//enable pre-flight cors
router.options('/', cors());

router.get('/', cors(), function (req, res) {
    if(!utils.hasBasicToken(req.headers.authorization))
        return res.status(401).jsonp();
    res.status(200).jsonp(redisCache.status());
});

module.exports = router;