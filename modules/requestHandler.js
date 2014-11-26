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
var validator = require('./response-request-verifier');
var Utils = require('./Utils');
var log4js = require('log4js');
var logger = log4js.getLogger('Request Handler');

var requiredMinimumFrameworkVersion = "5.0.0";

exports.handleRequest = function (body, callback) {
    var fwVersion = (body.frameworkVersion);
    var errorMsg = null;

    if (!validator.validateRequest(body)) {
        errorMsg = 'Invalid request body. Missing essential content';
    } else if (!Utils.isMinimumRequiredVersion(fwVersion, requiredMinimumFrameworkVersion)) {
        errorMsg = "The version of the Framework you are using is too old, please upgrade";
    }

    if (errorMsg) {
        return callback({
            serviceid: body.serviceid || "",
            socketid: body.socketid || null,
            response: {
                code: 403,
                origin: 'internal',
                data: {
                    error: errorMsg
                }
            }
        });
    }

    // See if this is a local service
    var requester = intRequest.isLocalService(body) ? intRequest : extRequest;

    requester.makeRequest(body, function (response) {
        if (!validator.validateResponse(response)) {
            logger.error('The response we got is invalid: ' + JSON.stringify(response));
        }

        callback(response);
    });
};