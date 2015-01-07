var utils = require('util');
var PollingCacher = require('./polling-cacher');
var logger = require('log4js').getLogger('boot-script');

var pollingCacher = new PollingCacher();
var storesRepository = require('../../modules/stores/store-repository');
var vacanciesRepository = require('../services/vacancies-repository');
var shoppingListGroupRepository = require('../services/shopping-list-group-repository');
var recommendationsRepository = require('../services/recommendations-repository');
var synonymsRepository = require('../services/synonyms-repository');

// cache stores
var chainIds = [1100, 1210, 1220, 1270, 1300, 1320];

chainIds.forEach(function (chainId) {

    var ONE_MINUTE = 60;
    var FIVE_MINUTES = 5 * ONE_MINUTE;
    var TEN_MINUTES = 10 * ONE_MINUTE;
    var HALF_HOUR = 30 * ONE_MINUTE;
    var ONE_HOUR = 60 * ONE_MINUTE;
    var ONE_DAY = 24 * ONE_HOUR;

    pollingCacher.addRequest(storesRepository.getStoreRequest(chainId), {
        useInMemCache: true,
        intervalInSeconds: FIVE_MINUTES,
        refreshHandler: function (err, stores) {

            if (err) {
                logger.error(err);
            }

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

            if (err) {
                logger.error(err);
            }

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

            if (err) {
                logger.error(err);
            }

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

            if (err) {
                if (err.code === 404 && err.origin === 'ngt') {
                    // ShoppingListGroup does not exist for all chains
                    return;
                }
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

    pollingCacher.addRequest(recommendationsRepository.getRecommendationsRequest(chainId), {
        useInMemCache: true,
        intervalInSeconds: FIVE_MINUTES,
        refreshHandler: function (err, recommendations) {

            if (err) {
                logger.error(err);
            }

            if (recommendations) {
                logger.info(utils.format('Refreshed recommendations cache for %s. Got %d recommendations', chainId, recommendations.length));
            }
            else {
                logger.error('An error has occurred when trying to refresh the recommendations cache');
            }
        }
    });

    pollingCacher.addRequest(synonymsRepository.getSynonymsRequest(chainId), {
        useInMemCache: true,
        intervalInSeconds: FIVE_MINUTES,
        refreshHandler: function (err, synonyms) {

            if (err) {
                logger.error(err);
            }

            if (synonyms) {
                logger.info(utils.format('Refreshed synonyms cache for %s. Got %d synonyms', chainId, synonyms.length));
            }
            else {
                logger.error('An error has occurred when trying to refresh the synonyms cache');
            }
        }
    })

});

exports.start = function () {
    logger.info('Starting warming of caches');
    pollingCacher.start();
};
exports.stop = function () {
    pollingCacher.stop();
};
