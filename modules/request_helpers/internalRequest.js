'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('Internal Request Resolver');

var productSearchModule = require('./../productSearch/searchUtil');
var trumfTermsAndConditionsModule = require('./../terms_caching/terms_cacher');
var persistenceSyncModule = require('./../synchronize/request-adapter');

var RequestCacher = require('../caching/request-cacher');
var requestCacher = new RequestCacher({maxAgeInSeconds: 24 * 60 * 60});
var cachingRequestHandler = requestCacher.handleRequest.bind(requestCacher);

var localServices = {
    'persistenceSynchronize': {method: persistenceSyncModule.synchronize},
    'trumfProfile_termsAndConditions': {method: trumfTermsAndConditionsModule.fetch},
    'productSearchProducts': {method: productSearchModule.search},
    'productSearchGroups': {method: productSearchModule.search},
    'productSearchBoth': {method: productSearchModule.search},
    'productSearchGetProductsForGroup': {method: productSearchModule.search},
    'productSearchGetAllCategories': {method: productSearchModule.search},
    'productSearchGetProductById': {method: productSearchModule.search},

    // cached requests
    'productDetails2': {method: cachingRequestHandler},
    'recommendations': {method: cachingRequestHandler},
    'storesGetStore': {method: cachingRequestHandler},
    'brandMatch': {method: cachingRequestHandler}
};

var isLocalService = function (requestBody) {
    var serviceName = requestBody.servicename;
    return serviceName in localServices;
};


var getMethod = function (serviceName) {
    var res = localServices[serviceName];
    return res && res.method || false;
};

var makeRequest = function (requestBody, callback) {
    logger.debug('Resolving request');

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

module.exports = exports = {
    makeRequest: makeRequest,
    isLocalService: isLocalService
};
