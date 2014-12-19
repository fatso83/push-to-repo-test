var express = require('express');
var router = express.Router();
var cors = require('cors');

var requestBuilder = require('../modules/request_helpers/request-builder');

var log4js = require('log4js');
var logger = log4js.getLogger('Root Request Router');

// enable pre-flight cors
router.options('/', cors());

router.get('/', cors(), function (req, res) {
	res.render('index');
});

router.post('/', cors(), function (req, res) {

	var body = req.body;

	requestBuilder.routeToRequest(body, function(result) {
		res.status(result.response.code || 500).json(result);
	});
});

module.exports = router;