'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('Internal Request Resolver');

// caching
var RequestCacher = require('../caching/request-cacher');

var ONE_DAY = 24 * 60 * 60;
var FOUR_HOURS = 4 * 60 * 60;

// Request handler
var requestCacher = new RequestCacher({
    maxAgeInSeconds: ONE_DAY,
    maxStaleInSeconds: FOUR_HOURS
});
var cachingRequestHandler = requestCacher.handleRequest.bind(requestCacher);

// Basic request handler
var requestCacherBasic = new RequestCacher({
    maxAgeInSeconds: ONE_DAY,
    maxStaleInSeconds: FOUR_HOURS,
    basicToken: true
});
var cachingBasicRequestHandler = requestCacherBasic.handleRequest.bind(requestCacherBasic);

// Bearer request handler
var requestCacherBearer = new RequestCacher({
    maxAgeInSeconds: ONE_DAY,
    maxStaleInSeconds: FOUR_HOURS,
    basicToken: true,
    bearerToken: true
});
var cachingBearerRequestHandler = requestCacherBearer.handleRequest.bind(requestCacherBearer);

var productSearchModule = require('./../productSearch/searchUtil');
var trumfTermsAndConditionsModule = require('./../terms_caching/terms_cacher');
var persistenceSyncModule = require('./../synchronize/request-adapter');
var storesAdapter = require('../stores/request-adapter');

var localServices = {
    'persistenceSynchronize': persistenceSyncModule.synchronize,
    'trumfProfile_termsAndConditions': trumfTermsAndConditionsModule.fetch,
    'productSearchProducts': productSearchModule.search,
    'productSearchGroups': productSearchModule.search,
    'productSearchBoth': productSearchModule.search,
    'productSearchGetProductsForGroup': productSearchModule.search,
    'productSearchGetAllCategories': productSearchModule.search,
    'productSearchGetProductById': productSearchModule.search,

    // custom handlers
    'allStoresInCounties': storesAdapter.getAllStoresInCounties,
    'storesGetStore': storesAdapter.getAllStores,

    // can't be cached
    'storesClosestToMe': storesAdapter.closestToMe,
    'storesGetSingleStore': storesAdapter.getSingleStore,

    // cached requests
    'productDetails2': cachingRequestHandler,

    // requires basic authentication
    'shoppingListGroup': cachingBasicRequestHandler,
    'brandMatch': cachingBasicRequestHandler,
    'vacancies': cachingBasicRequestHandler,
    'synonyms': cachingBasicRequestHandler,
    'municipalities': cachingBasicRequestHandler,
    'counties': cachingBasicRequestHandler,
    'postalAddress': cachingBasicRequestHandler,

    // additional functionality using bearer token
    'recommendations': cachingBearerRequestHandler
};

var isLocalService = function (requestBody) {
    var serviceName = requestBody.servicename;
    return serviceName in localServices;
};

var getMethod = function (serviceName) {
    var res = localServices[serviceName];
    return res || false;
};

var makeRequest = function (requestBody, callback) {
    logger.debug('Resolving request for service ', requestBody.servicename);

    var responseObj = {
        serviceId: requestBody.serviceId,
        response: {
            code: 200,
            origin: 'internal',
            data: {}
        }
    };

    var method = getMethod(requestBody.servicename);

    if (method) {
        method(requestBody, function (response, error) {

            if (error) {
                responseObj.response.data = error.data || {};
                responseObj.response.code = error.code || 500;
                responseObj.response.origin = error.origin || 'internal';
                callback(responseObj);
            } else {
                responseObj.response.data = response;
                responseObj.response.origin = response.origin || 'internal';
                callback(responseObj);
            }
        });
    } else {
        responseObj.response.code = 500;
        responseObj.response.data = 'No service name supplied in request body';
        callback(responseObj);
    }
};

exports.makeRequest = makeRequest;
exports.isLocalService = isLocalService;