/**
 * @param requestBody as from the framework. the actual body is in payload
 * @param callback reverse parameter order of Node convention function(result, error)
 */

var service = require('./store_service');
var url = require('url');
var _ = require('lodash');
var querystring = require('querystring');
var isNumber = require("isnumber");

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

module.exports = function (requestBody, callback) {

    var parsedUrl, params, chainId;
    
    // ensure easier parsing of parameters
    parsedUrl = url.parse(requestBody.servicepath.toLowerCase());
    chainId = parsedUrl.pathname.substr(parsedUrl.pathname.lastIndexOf('/')+1);
    params = querystring.parse(parsedUrl.query);
    

    if (missingMandatoryParameters(params)) {
        callback(null, {data: "Mandatory query parameters are: latitude, longitude", code: 400});
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
