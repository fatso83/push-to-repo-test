var express = require('express');
var router = express.Router();
var service = require('../modules/terms_caching/terms_cacher');

router.get('/', function (req, res) {
	service.fetch(function(err, data){
		res.json( { data : data});
	});
});

module.exports = router;