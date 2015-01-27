var express = require('express');
var router = express.Router();
var cors = require('cors');

var log4js = require('log4js');
var logger = log4js.getLogger('Postal address');

var requestBuilder = require('../../modules/request_helpers/request-builder');

//enable pre-flight cors
router.options('/', cors());

router.get('/', cors(), function (req, res) {

    var request = {
        serviceName: 'postalAddress',
        url: req.originalUrl,
        headers: req.headers
    };
    requestBuilder.routeToRequest(request, res);
});

module.exports = router;