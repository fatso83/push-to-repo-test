var builder = require('../request_helpers/request-builder');
var internalRequestHandler = require('../request_helpers/internalRequest');

var getStoreUrl = function(chainId) {
    return 'api/FindStore/Stores/' + chainId + '?checkForHolidays=365';
};

var getStoreRequest = function(chainId) {

    return builder.createRequestBody({
        servicename: 'storesGetStore',
        servicepath: getStoreUrl(chainId)
    });
};

var getStores = function repository(chainId, cb) {
    internalRequestHandler.makeRequest(
        getStoreRequest(chainId) , cb
    );
};


module.exports = {
    getStores : getStores,
    getStoreRequest :  getStoreRequest,
    getStoreUrl : getStoreUrl
};
