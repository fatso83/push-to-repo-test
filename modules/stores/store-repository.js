var builder = require('../request_helpers/request-builder');
var internalRequestHandler = require('../request_helpers/internalRequest');

var defaultCheckForHolidaysDaysAhead = 35;

var getStoreUrl = function (chainId, checkForHolidaysDaysAhead) {
    var checkForHolidays = checkForHolidaysDaysAhead | defaultCheckForHolidaysDaysAhead;
    return 'api/FindStore/Stores/' + chainId + '?checkForHolidays=' + checkForHolidays; //fetches special opening hours n days ahead.
};

var getCountyUrl = function (chainId) {
    return 'api/FindStore/AllStoresInCounties/' + chainId;
};

var getStoreRequest = function(chainId) {

    return builder.createRequestBody({
        servicename: 'storesGetStore',
        servicepath: getStoreUrl(chainId)
    });
};

var getCountyRequest = function(chainId) {
    return builder.createRequestBody({
        servicename: 'allStoresInCounties',
        servicepath: getCountyUrl(chainId)
    });
}

var getStores = function repository(chainId, cb) {
    internalRequestHandler.makeRequest(
        getStoreRequest(chainId) , cb
    );
};


module.exports = {
    getStores : getStores,
    getStoreRequest :  getStoreRequest,
    getCountyRequest : getCountyRequest,
    getStoreUrl : getStoreUrl
};
