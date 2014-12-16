var requestHandler = require('../modules/requestHandler');
var builder = require('../modules/request_helpers/request-builder');

var log4js = require('log4js');
var logger = log4js.getLogger('FindStore');


function logTimer(description, time) {
    var diff = process.hrtime(time);
    logger.info(description, diff[0] * 1e9 + diff[1]);
};

function routeToRequestHandler(res, serviceName, url) {

    var startTime = process.hrtime();
    var body = builder.createRequestBody(
        {
            servicename: serviceName,
            servicepath: url
        }
    );

    logger.trace('Got request for ', serviceName);

    res.on('finish', function () {
        logTimer('Request has been sent of to the network stack. Total time: %d nanoseconds', startTime);
    });

    requestHandler.handleRequest(body, function (result) {
        logTimer('Request took %d nanoseconds', startTime);
        res.status(result.response.code || 500).jsonp(result.response.data);
    });
}

module.exports.handler = routeToRequestHandler;