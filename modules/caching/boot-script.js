var utils = require('util');
var PollingCacher = require('./polling-cacher');
var logger = require('log4js').getLogger('boot-script');

var environment = 'preprod';
var storeCacher = new PollingCacher();

// cache stores
var chainIds = [1100, 1210, 1300];
chainIds.forEach(function (chainId) {

    storeCacher.addRequest({
        environment : environment,
        servicename: 'storesGetStore',
        servicepath: 'api/findstore/stores/' + chainId,
        frameworkVersion: '5.0.0',
        headers: []
    }, {
        intervalInSeconds: 60*60,
        refreshHandler : function(stores) {
            if(stores) { logger.info(utils.format('Refreshed store cache for %s. Got %d stores' , chainId, stores.length)); }
            else { logger.error('An error has occurred when trying to refresh the store cache'); }
        }
    });

});

exports.start = function() {
    logger.info('Starting warming of caches');
    storeCacher.start();
};
exports.stop = function() {
    storeCacher.stop();
};
