var express = require('express');
var router = express.Router();
var cors = require('cors');

var storesRepository = require('../modules/stores/store-repository');

var log4js = require('log4js');
var logger = log4js.getLogger('FindStore');
var routeToRequest = require('./routeToRequest');


//enable pre-flight cors
router.options('/', cors());

/**
 * location based service
 */
router.get('/StoresClosestToMe/:chainid', cors(), function (req, res) {
    routeToRequest.handler(res, 'storesClosestToMe', req.originalUrl);
});

/**
 * fetches stores grouped on counties
 */
router.get('/AllStoresInCounties/:chainid', cors(), function (req, res) {
    routeToRequest.handler(res, 'allStoresInCounties', storesRepository.getCountyUrl(req.params.chainid));
});


/**
 * fetches all stores or a specific one
 */
router.get('/Stores/:chainid', cors(),
    function (req, res) {

        if (req.query && (req.query.storeId || req.query.storeid)) {
            routeToRequest.handler(res, 'storesGetSingleStore', req.originalUrl);
        } else {
            routeToRequest.handler(res, 'storesGetStore', storesRepository.getStoreUrl(req.params.chainid));
        }
    }
);
module.exports = router;