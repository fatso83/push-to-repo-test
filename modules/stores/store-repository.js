
var internalRequestHandler = require('../request_helpers/internal-request');
var requestBuilder = require('./../request_helpers/request-builder');

var defaultCheckForHolidaysDaysAhead = 35;

var getStoreUrl = function (chainId, checkForHolidaysDaysAhead) {
    var checkForHolidays = checkForHolidaysDaysAhead | defaultCheckForHolidaysDaysAhead;
    return 'api/FindStore/Stores/' + chainId + '?checkForHolidays=' + checkForHolidays; //fetches special opening hours n days ahead.
};

var getCountyUrl = function (chainId, checkForHolidaysDaysAhead) {
    var checkForHolidays = checkForHolidaysDaysAhead | defaultCheckForHolidaysDaysAhead;
    return 'api/FindStore/AllStoresInCounties/' + chainId + '?checkForHolidays=' + checkForHolidays;
};

var getStoreRequest = function (chainId) {

    requestBuilder = require('./../request_helpers/request-builder');

    return requestBuilder.createRequestBody({
        servicename: 'storesGetStore',
        servicepath: getStoreUrl(chainId)
    });
};

var getCountyRequest = function (chainId) {
    return requestBuilder.createRequestBody({
        servicename: 'allStoresInCounties',
        servicepath: getCountyUrl(chainId)
    });
};

var getStores = function repository(chainId, cb) {
    internalRequestHandler.makeRequest(
        getStoreRequest(chainId), function (request) {

            if (request.response.code !== 200) {
                return cb(new Error("Error when fetching stores: " + JSON.stringify(request.response)));
            }

            cb(null, request.response.data);
        }
    );
};

module.exports = {
    getStores: getStores,
    getStoreRequest: getStoreRequest,
    getCountyRequest: getCountyRequest,
    getStoreUrl: getStoreUrl,
    getCountyUrl: getCountyUrl
};
