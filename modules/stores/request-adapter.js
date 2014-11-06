/**
 * @param requestBody as from the framework. the actual body is in payload
 * @param callback reverse parameter order of Node convention function(result, error)
 */

var m = require('./store_service');
var url = require('url');
var _ = require('lodash');
var querystring = require('querystring');

function missingMandatoryParameters(params) {
    return !('longitude' in params && 'latitude' in params);
}

module.exports = function (requestBody, callback) {

    var parsedUrl, params;

    // ensure easier parsing of parameters
    parsedUrl = url.parse(requestBody.servicepath.toLowerCase());
    params = querystring.parse(parsedUrl.query);

    if (missingMandatoryParameters(params)) {
        callback(null, { data : "Mandatory query parameters are: latitude, longitude", code : 400 } );
        return;
    }

    try {
        var result = m.getClosestStores(
            params.latitude,
            params.longitude,
            params.minnumberofstores,
            params.maxnumberofstores,
            params.maxdistance,
            params.filter);

        callback(result);

    } catch(err) {
        callback(null, err);
    }
};
