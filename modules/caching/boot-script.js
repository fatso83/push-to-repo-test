var utils = require('util');
var PollingCacher = require('./polling-cacher');

var storeCacher = new PollingCacher();

// cache stores
[1100, 1210, 1300].forEach(function (chainId) {

    storeCacher.addRequest({
        servicename: 'storesGetStore',
        servicepath: 'api/findstore/stores/' + chainId,
        frameworkVersion: '5.0.0',
        headers: []
    }, {
        intervalInSeconds: 60,
        //refreshHandler : function(stores) {
        //    console.log(utils.format('Refreshed store cache for %s. Got %d stores' , chainId, stores.length));
        //}
    });

});

exports.start = function() {
    storeCacher.start();
};
exports.stop = function() {
    storeCacher.stop();
};
