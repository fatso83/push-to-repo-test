var express = require('express');
var router = express.Router();
var cors = require('cors');

var requestHandler = require('./../modules/requestHandler');

var log4js = require('log4js');

// enable pre-flight cors
router.options('/', cors());

function createRequestBody(servicename, path) {
	return {
		"environment": "preprod",
		"servicename": servicename,
		"servicepath": "api" + path,
		"frameworkVersion": "5.0.0",
		"headers" : []
	};
}

function routeToRequestHandler(res, serviceName, url) {
	requestHandler.handleRequest(createRequestBody(serviceName, url), function(result) {
		res.status(result.response.code || 500).json(result.response.data);
	});
}

// location based service
router.get('/StoresClosestToMe/:chainid', cors(), function (req, res) {
	routeToRequestHandler(res, 'storesClosestToMe',req.originalUrl);
});

// fetches stores grouped on counties
router.get('/AllStoresInCounties/:chainid', cors(), function(req,res) {
	routeToRequestHandler(res, 'allStoresInCounties',req.originalUrl);
});

// fetches all stores
router.get('/Stores/:chainid', cors(), function(req,res) {
	routeToRequestHandler(res, 'storesGetStore',req.originalUrl);
});
module.exports = router;