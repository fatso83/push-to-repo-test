var express = require('express');
var router = express.Router();
var cors = require('cors');

var storesRepository = require('../modules/stores/store-repository');
var requestBuilder = require('../modules/request_helpers/request-builder');

var log4js = require('log4js');
var logger = log4js.getLogger('FindStore');

//enable pre-flight cors
router.options('/', cors());

/**
 * location based service
 */
router.get('/StoresClosestToMe/:chainid', cors(), function (req, res) {

    var request = {
        serviceName: 'storesClosestToMe',
        url: req.originalUrl
    };

    requestBuilder.routeToRequest(request, res);
});

/**
 * fetches stores grouped on counties
 */
router.get('/AllStoresInCounties/:chainid', cors(), function (req, res) {

    var request = {
        serviceName: 'allStoresInCounties',
        url: storesRepository.getCountyUrl(req.params.chainid)
    };

    requestBuilder.routeToRequest(request, res);
});

/**
 * fetches all stores or a specific one
 */
router.get('/Stores/:chainid', cors(), function (req, res) {

    var request = {
        serviceName: null,
        url: null
    };

    if (req.query && (req.query.storeId || req.query.storeid)) {
        request.serviceName = 'storesGetSingleStore';
        request.url = req.originalUrl;
    } else {
        request.serviceName = 'storesGetStore';
        request.url = storesRepository.getStoreUrl(req.params.chainid);
    }

    requestBuilder.routeToRequest(request, res);
});

module.exports = router;