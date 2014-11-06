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
var verify = require('./request_helpers/response-verifier').verify;
var Utils = require('./Utils');
var log4js = require('log4js');
var logger = log4js.getLogger('Request Handler');

// Requires beta 11, which is the current released version
var requiredMinimumFrameworkVersion = "5.0.0";

exports.handleRequest = function (body, callback) {
    var fwVersion = (body.frameworkVersion);

    // If the caller Framework is too old
    // Then flat out deny the request
    if (!Utils.isMinimumRequiredVersion(fwVersion, requiredMinimumFrameworkVersion)) {
        return callback({
            serviceid: body.serviceid || "",
            socketid: body.socketid || null,
            response: {
                code: 403,
                origin: 'internal',
                data: {
                    error: "The version of the Framework you are using is too old, please upgrade"
                }
            }
        });
    }

    // See if this is a local service
    var requester = intRequest.isLocalService(body) ? intRequest : extRequest;

    requester.makeRequest(body, function (response) {
        if (!verify(response)) {
            logger.error('The response we got is invalid: ' + response);
        }

        callback(response);
    });
};