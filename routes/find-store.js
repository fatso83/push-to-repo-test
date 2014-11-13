var express = require('express');
var router = express.Router();
var cors = require('cors');

var requestHandler = require('./../modules/requestHandler');

var log4js = require('log4js');
var logger = log4js.getLogger('FindStore');

// enable pre-flight cors
router.options('/', cors());

function createRequestBody(servicename, path) {
    return {
        "environment": "preprod",
        "servicename": servicename,
        "servicepath": "api" + path,
        "frameworkVersion": "5.0.0",
        "headers": []
    };
}

function routeToRequestHandler(res, serviceName, url) {
    var t=Date.now();
    logger.trace('Got request for ', serviceName);
    res.on('finish', function() {
        logger.trace('Request has been sent of to the network stack. Total time:', Date.now() - t, 'ms');
    });
    requestHandler.handleRequest(createRequestBody(serviceName, url), function (result) {
        logger.trace('Request took ', Date.now() - t, 'ms to process');
        res.status(result.response.code || 500).jsonp(result.response.data);
    });
}

// location based service
router.get('/StoresClosestToMe/:chainid', cors(), function (req, res) {
    routeToRequestHandler(res, 'storesClosestToMe', req.originalUrl);
});

// fetches stores grouped on counties
router.get('/AllStoresInCounties/:chainid', cors(), function (req, res) {
    routeToRequestHandler(res, 'allStoresInCounties', req.originalUrl);
});

// fetches all stores
router.get('/Stores/:chainid', cors(), function (req, res) {
    routeToRequestHandler(res, 'storesGetStore', req.originalUrl);
});
module.exports = router;