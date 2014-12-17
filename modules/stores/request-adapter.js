/**
 * @param requestBody as from the framework. the actual body is in payload
 * @param callback reverse parameter order of Node convention function(result, error)
 */

var service = require('./store_service');
var storeRepo = require('./store-repository');
var url = require('url');
var _ = require('lodash');
var querystring = require('querystring');
var isNumber = require("isnumber");
var re_chainId = /\/(\d{4})\/?$/;

// these requests should already be in a warm cache that is regularly updated,
// so there is no need to configure the caching
var RequestCacher = require('../caching/request-cacher');
var requestCacher = new RequestCacher();

function missingMandatoryParameters(params) {
    return !('longitude' in params && 'latitude' in params);
}

var parseWithFallback = function (parser) {
    return function (s, defaultVal) {
        return isNumber(s) ? parser(s) : defaultVal;
    };
};

var int = parseWithFallback(parseInt);
var float = parseWithFallback(parseFloat);

function getSingleStore(requestBody, callback) {
    var parsedUrl, params, chainId, match;

    // ensure easier parsing of parameters
    parsedUrl = url.parse(requestBody.servicepath.toLowerCase());
    match = parsedUrl.pathname.match(re_chainId);
    params = querystring.parse(parsedUrl.query);

    if (!match) {
        callback(null, {data: "Missing chain id as path parameter", code: 400});
        return;
    }
    chainId = match[1];

    service.getSingleStore(
        int(chainId),
        int(params.storeid),
        function (err, result) {
            if (err) {
                callback(null, err);
            }
            else if (result) {
                callback(result);
            }
            else {
                // none found
                callback(null, {code: 404});
            }
        }
    );
}

/**
 * @param requestBody
 * @param callback(result, err) UNCONVENTIONAL USE in internalRequestHandler
 */
function closestToMe(requestBody, callback) {

    var parsedUrl, params, chainId, match;

    // ensure easier parsing of parameters
    parsedUrl = url.parse(requestBody.servicepath.toLowerCase());
    match = parsedUrl.pathname.match(re_chainId);
    params = querystring.parse(parsedUrl.query);

    if (!match) {
        callback({data: "Missing chain id as path parameter", code: 400});
        return;
    }
    chainId = match[1];

    if (missingMandatoryParameters(params)) {
        callback({data: "Mandatory query parameters are: latitude, longitude", code: 400});
        return;
    }

    try {
        service.getClosestStores(
            int(chainId),
            float(params.latitude),
            float(params.longitude),
            int(params.minnumberofstores, 1),
            int(params.maxnumberofstores, null),
            float(params.maxdistance, null),
            params.filter || "",

            // adapter for the big mistake in not following conventions in internalRequestHandler
            function (err, result) {
                callback(result, err);
            }
        );
    } catch (err) {
        callback(null, err);
    }
}

function getChainIdPathParam(servicepath) {
    var parsedUrl=url.parse(servicepath);
    var regExp = /.*\/([0-9]+)\/?/;
    return  parsedUrl.pathname.match(regExp)[1];
}

// We ask for a standard representation of the url to hit our warm cache
function getAllStoresInCounties(requestBody, callback) {
    var chainId = getChainIdPathParam(requestBody.servicepath);
    requestCacher.handleRequest(storeRepo.getCountyRequest(chainId), callback);
}

// We ask for a standard representation of the url to hit our warm cache
function getAllStores(requestBody, callback) {
    var chainId = getChainIdPathParam(requestBody.servicepath);
    requestCacher.handleRequest(storeRepo.getStoreRequest(chainId), callback);
}

exports.closestToMe = closestToMe;
exports.getSingleStore = getSingleStore;
exports.getAllStoresInCounties = getAllStoresInCounties;
exports.getAllStores = getAllStores;
