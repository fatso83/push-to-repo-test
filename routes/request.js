var express = require('express');
var extRequest = require('./../modules/externalRequest');
var router = express.Router();
var cors = require('cors');
var log4js = require('log4js');
var logger = log4js.getLogger('Root Request Router');


// enable pre-flight cors
router.options('/', cors());

router.get('/', cors(), function (req, res) {
	res.render('index');
});

router.post('/', cors(), function (req, res) {
	var body = req.body;
	extRequest.makeRequest(body, function (response) {
		logger.debug('Finished processing response');
		res.json(response);
	});
});


module.exports = router;