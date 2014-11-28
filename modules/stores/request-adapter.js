/**
 * @param requestBody as from the framework. the actual body is in payload
 * @param callback reverse parameter order of Node convention function(result, error)
 */

var service = require('./store_service');
var url = require('url');
var _ = require('lodash');
var querystring = require('querystring');
var isNumber = require("isnumber");
var re_chainId = /\/(\d{4})\/?$/;

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
        callback(null, { data: "Missing chain id as path parameter", code: 400 });
        return;
    }
    chainId = match[1];

    try {
        service.getSingleStore(
            int(chainId),
            params.storeid,
            callback
        );
    } catch (err) {
        callback(null, err);
    }
}

function closestToMe(requestBody, callback) {
    
    var parsedUrl, params, chainId, match;
    
    // ensure easier parsing of parameters
    parsedUrl = url.parse(requestBody.servicepath.toLowerCase());
    match = parsedUrl.pathname.match(re_chainId);
    params = querystring.parse(parsedUrl.query);
    
    if (!match) {
        callback(null, { data: "Missing chain id as path parameter", code: 400 });
        return;
    }
    chainId = match[1];
    
    if (missingMandatoryParameters(params)) {
        callback(null, { data: "Mandatory query parameters are: latitude, longitude", code: 400 });
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
            callback
        );
    } catch (err) {
        callback(null, err);
    }
};


exports.closestToMe = closestToMe;
exports.getSingleStore = getSingleStore;
