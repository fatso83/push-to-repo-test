var utils = require('util');
var PollingCacher = require('./polling-cacher');
var logger = require('log4js').getLogger('boot-script');

var pollingCacher = new PollingCacher();
var storesRepository = require('../../modules/stores/store-repository');
var vacanciesRepository = require('../services/vacancies-repository');
var shoppingListGroupRepository = require('../services/shopping-list-group-repository');

// cache stores
var chainIds = [1100, 1210, 1220, 1270, 1300, 1320];

chainIds.forEach(function (chainId) {

    var FIVE_MINUTES = 5 * 60;

    pollingCacher.addRequest(storesRepository.getStoreRequest(chainId), {
        useInMemCache: true,
        intervalInSeconds: FIVE_MINUTES,
        refreshHandler: function (err, stores) {
            if (stores) {
                logger.info(utils.format('Refreshed store cache for %s. Got %d stores', chainId, stores.length));
            }
            else {
                logger.error('An error has occurred when trying to refresh the store cache');
            }
        }
    });

    pollingCacher.addRequest(storesRepository.getCountyRequest(chainId), {
        useInMemCache: true,
        intervalInSeconds: FIVE_MINUTES,
        refreshHandler: function (err, counties) {
            if (counties) {
                logger.info(utils.format('Refreshed county cache for %s. Got %d counties', chainId, counties.length));
            }
            else {
                logger.error('An error has occurred when trying to refresh the county cache');
            }
        }
    });

    pollingCacher.addRequest(vacanciesRepository.getVacancyRequest(chainId), {
        useInMemCache: true,
        intervalInSeconds: FIVE_MINUTES,
        refreshHandler: function (err, vacancies) {
            if (vacancies) {
                logger.info(utils.format('Refreshed vacancies cache for %s. Got %d vacancies', chainId, vacancies.length));
            }
            else {
                logger.error('An error has occurred when trying to refresh the vacancy cache');
            }
        }
    });

    pollingCacher.addRequest(shoppingListGroupRepository.getShoppingListGroupRequest(chainId), {
        useInMemCache: true,
        intervalInSeconds: FIVE_MINUTES,
        refreshHandler: function (err, shoppingListGroups) {

            if(err){
                logger.error(err);
            }

            if (shoppingListGroups) {
                logger.info(utils.format('Refreshed shoppingListGroup cache for %s. Got %d shoppingListGroups', chainId, shoppingListGroups.length));
            }
            else {
                logger.error('An error has occurred when trying to refresh the shoppingListGroup cache');
            }
        }
    });
});

exports.start = function () {
    logger.info('Starting warming of caches');
    pollingCacher.start();
};
exports.stop = function () {
    pollingCacher.stop();
};
