/**
 * This module has one method called «handleRequest»
 * This method takes a request body from either a router or a socket.
 * The method returns the resulting response object which is the
 * same for both external and internal requests
 *
 * Response object
 * @example
 * var responseObj = {
 *		serviceId : requestData.serviceId,
 *		response  : {
 *			code   : 0,
 *			origin : 'ngt', // or internal
 *			data   : {}
 *		}
 *	};
 */

'use strict';

var intRequest = require('./request_helpers/internalRequest');
var extRequest = require('./request_helpers/externalRequest');
var Utils = require('./Utils');
var log4js = require('log4js');
var logger = log4js.getLogger('Request Handler');

var requiredMinimumFrameworkVersion = "5.0.0";

var invalidRequestErrorMessage = 'Invalid request body. Missing essential content';
var oldFrameworkErrorMessage = 'The version of the Framework you are using is too old, please upgrade';

/**
 *
 * @param {obj} body
 * @param {string} errorMessage
 * @returns {obj}
 */
function getErrorMessage(body, errorMessage) {
    return {
        serviceid: body.serviceid || '',
        socketid: body.socketid || null,
        response: {
            code: 403,
            origin: 'internal',
            data: {
                error: errorMessage
            }
        }
    };
}

/**
 *
 * @param {obj} req
 * @param {string} req.servicepath
 * @param {string} req.servicename
 * @param {string} req.frameworkVersion
 * @returns {boolean}
 */
function validateRequest(req) {
    return typeof req.servicepath === 'string' &&
        typeof req.servicename === 'string' &&
        typeof req.frameworkVersion === 'string';
}

/**
 *
 * @param {obj} response
 * @param {obj} response.response
 * @returns {boolean}
 */
function validateResponse(response) {
    var unwrapped = response.response;
    return typeof unwrapped.code === 'number' &&
        typeof unwrapped.origin === 'string' &&
        typeof unwrapped.data !== 'undefined';

}

/**
 *
 * @param {object} body
 * @param {string} body.frameworkVersion
 * @param callback
 * @returns {*}
 */
function handleRequest(body, callback) {
    var frameworkVersion = body.frameworkVersion;
    var errorMessage = null;

    if (!validateRequest(body)) {
        errorMessage = invalidRequestErrorMessage;
    } else if (!Utils.isMinimumRequiredVersion(frameworkVersion, requiredMinimumFrameworkVersion)) {
        errorMessage = oldFrameworkErrorMessage;
    }

    if (errorMessage) {
        return callback(getErrorMessage(body, errorMessage));
    }

    // Check if this is a local service
    var requester = intRequest.isLocalService(body) ? intRequest : extRequest;

    requester.makeRequest(body, function (response) {
        if (!validateResponse(response)) {
            logger.error('The response we got is invalid: ' + JSON.stringify(response));
        }

        return callback(response);
    });
}

module.exports.handleRequest = handleRequest;