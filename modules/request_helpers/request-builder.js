var _ = require('lodash');
var config = null;

var requestHandler = require('../request_helpers/request-handler');

/*
 *  Async operation, but we expect it to be loaded by app.js by now, effectively
 *  making it a synchronous request
 */
require('../configuration-loader').load(function (loadedConfig) {
    config = loadedConfig;
});
var logger = require('log4js').getLogger('RequestBuilder');

var internalServerError = 500;
var responseFinished = 'finish';

var requestStartedMessage = 'Got a request for ';
var finishedEventMessage = 'Request has been sent of to the network stack. Total time: %d nanoseconds';
var requestHandledMessage = 'Request took %d nanoseconds';

var defaultHeaders = [];

/**
 *
 * @param {object} headers
 * @param {string || undefined} headers.authorization
 * @returns {Array}
 */
function extractExpressHeaders(headers) {
    var extractedHeaders = [];

    if (headers.authorization) {
        extractedHeaders.push({
            authorization: headers.authorization
        });
    }

    return extractedHeaders;
}

function getFrameworkRequest(req) {

    if (!req.headers) {
        req.headers = defaultHeaders;
    }

    return {
        servicename: req.serviceName,
        servicepath: req.url,
        servicemethod: req.serviceMethod,
        payload: req.payload,
        headers: req.headers
    };
}


function logTimer(description, startTime) {
    var diff = process.hrtime(startTime);
    var totalNanoseconds = diff[0] * 1e9 + diff[1];
    logger.info(description, totalNanoseconds);
}

/**
 *
 * @param {object} req
 * @param {string} req.serviceName
 * @param {string} req.url
 * @param {Array || undefined} req.headers
 * @param {object} res
 */
function routeToRequest(req, res) {
    logger.trace(requestStartedMessage, req.servicename);

    var startTime = process.hrtime();
    var frameworkRequest = getFrameworkRequest(req);
    var requestBody = createRequestBody(frameworkRequest);

    var finishedEventEvent = function () {
        logTimer(finishedEventMessage, startTime);
    };

    var handleRequestCallback = function (result) {
        logTimer(requestHandledMessage, startTime);
        res.status(result.response.code || internalServerError).jsonp(result.response.data);
    };

    res.on(responseFinished, finishedEventEvent);
    requestHandler.handleRequest(requestBody, handleRequestCallback);
}

/**
 *
 * @param {object} opts
 * @param {string} opts.servicename
 * @param {string} opts.servicepath
 * @param {Array || undefined} opts.headers
 * @returns {object}
 */
function createRequestBody(opts) {
    if (!opts.servicename || !opts.servicepath) {
        throw new Error('Compulsory keys missing');
    }

    if (!opts.headers) {
        opts.headers = defaultHeaders;
    }
    else if (opts.headers && typeof opts.headers === 'object') {

        // Assuming headers are from express if they are wrapped in an object.
        opts.headers = extractExpressHeaders(opts.headers);
    }

    var defaults = {
        "environment": config.caching.environment,
        "frameworkVersion": config['minimum framework version'],
        "headers": opts.headers
    };

    return _.extend(defaults, opts);
}

/**
 * Used when testing
 * @param fakeConfig
 */
function setConfig(fakeConfig) {
    config = fakeConfig;
}

module.exports = exports = {
    createRequestBody: createRequestBody,
    routeToRequest: routeToRequest,
    setConfig: setConfig
};
