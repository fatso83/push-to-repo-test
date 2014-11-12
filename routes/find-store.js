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
		"frameworkVersion": "5.0.0"
	};
}
//router.get('/StoresClosestToMe/:id', cors(), function (req, res) {
//
//});

router.get('/StoresClosestToMe/:id', cors(), function (req, res) {
	//console.log('asdf;alskdjfas',req);
	//res.send('jhello');
	requestHandler.handleRequest(createRequestBody('storesClosestToMe',req.originalUrl), function(result) {
		//console.log(result.body)
		res.status(result.response.code || 500).json(result.response.data);
	});
});

module.exports = router;