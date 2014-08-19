var express = require('express');
var router = express.Router();
var service = require('../modules/synchronize/service');
var log4js = require('log4js');
var logger = log4js.getLogger('Synchronize Router');

var nonExistingRoute = {error : "That route does not exist"};

router.post('/:chainId/:userId', function (req, res) {

	if( 'application/json' !== req.headers['content-type']) {
		res.json(400, 'Content type needs to be set to "application/json"');
		return;
	}

	service.synchronize(req.params.chainId,req.params.userId, req.body, function(err, result) {
		if(err) {
			logger.error('Caught error ' + err);
			res.json(500, { error : err.toString() });
		}
		else res.json(200, result);
	});
});

router.post("*", function (req, res) {
	res.json(404, nonExistingRoute);
});
router.get("*", function (req, res) {
	res.json(404, nonExistingRoute);
});


module.exports = router;