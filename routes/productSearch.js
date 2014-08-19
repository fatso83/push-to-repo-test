var express = require('express');
var router = express.Router();
var parser = require('./../modules/productSearch/searchUtil');

var nonExistingRoute = {error : "That route does not exist"};

router.get('/updateData', function (req, res) {
	var key = "iUaYeVpLLHEn4PoHsujrZhmcuGN8GtmFtwbhEqAL";
	if (req.headers['x-update-key'] && req.headers['x-update-key'] === key) {
		parser.updateData();
		res.json(200, {status : 'Updating'});
	} else {
		res.json(401, {status : 'Piss off!'});
	}
});

// Search both groups and products
router.post('/:chainID', function (req, res) {
	var config = req.body.config || {};
	var response = parser.combinedSearch(req.body.query || "", req.params.chainID || 0, config);
	if (response) {
		res.json(200, response);
	} else {
		res.json(404, nonExistingRoute);
	}

});

// Get all category ids
router.get('/:chainID/categories', function (req, res) {
	var response = parser.getAllCategories(req.params.chainID || 0);
	if (response) {
		res.json(200, response);
	} else {
		res.json(404, nonExistingRoute);
	}
});

// Search only groups
router.post('/:chainID/groups', function (req, res) {
	var config = req.body.config || {};
	var response = parser.getGroupsByTitle(req.body.query || "", req.params.chainID || 0, config);
	if (response) {
		res.json(200, response);
	} else {
		res.json(404, nonExistingRoute);
	}
});

// Get all products within a group
router.get('/:chainID/groups/:id', function (req, res) {
	var response = parser.getProductsForGroup(req.params.id || 0, req.params.chainID || 0);
	if (response) {
		res.json(200, response);
	} else {
		res.json(404, nonExistingRoute);
	}
});

// Search only products
router.post('/:chainID/products', function (req, res) {
	var config = req.body.config || {};
	var response = parser.getProductsByTitle(req.body.query || "", req.params.chainID || 0, config);
	if (response) {
		res.json(200, response);
	} else {
		res.json(404, nonExistingRoute);
	}
});

// Get a specific product by id
router.get('/:chainID/products/:id', function (req, res) {
	var response = parser.getProductById(req.params.id || 0, req.params.chainID || 0);
	if (response) {
		res.json(200, response);
	} else {
		res.json(404, {error : "Could not find any product with that id"});
	}
});

router.post("*", function (req, res) {
	res.json(404, nonExistingRoute);
});

module.exports = router;