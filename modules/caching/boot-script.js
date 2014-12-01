var utils = require('util');
var PollingCacher = require('./polling-cacher');
var logger = require('log4js').getLogger('boot-script');

var storeCacher = new PollingCacher();
var storesRepository = require('../../modules/stores/store-repository');

// cache stores
var chainIds = [1100, 1210, 1220, 1270, 1300, 1320];


chainIds.forEach(function (chainId) {

    storeCacher.addRequest(storesRepository.getStoreRequest(chainId), {
        intervalInSeconds: 60 * 60,
        refreshHandler: function (stores) {
            if (stores) {
                logger.info(utils.format('Refreshed store cache for %s. Got %d stores', chainId, stores.length));
            }
            else {
                logger.error('An error has occurred when trying to refresh the store cache');
            }
        }
    });

    storeCacher.addRequest(storesRepository.getCountyRequest(chainId), {
        intervalInSeconds: 60 * 60,
        refreshHandler: function (counties) {
            if (counties) {
                logger.info(utils.format('Refreshed county cache for %s. Got %d counties', chainId, counties.length));
            }
            else {
                logger.error('An error has occurred when trying to refresh the county cache');
            }
        }
    });
});

exports.start = function () {
    logger.info('Starting warming of caches');
    storeCacher.start();
};
exports.stop = function () {
    storeCacher.stop();
};
