/**
 * This module has one method called «handleRequest»
 * This method takes a request body from either a router or a socket.
 * The method returns the resulting response object which is the
 * same for both external and internal requests
 *
 * Response object
 * @example
 * var responseObj = {
 *		serviceid : requestData.serviceid,
 *		socketid  : requestData.socketid || null,
 *		response  : {
 *			code   : 0,
 *			origin : 'ngt', // or internal
 *			data   : {}
 *		}
 *	};
 */

var intRequest = require('./request_helpers/internalRequest');
var extRequest = require('./request_helpers/externalRequest');
var log4js = require('log4js');
var logger = log4js.getLogger('Request Handler');

exports.handleRequest = function(body, callback) {
	// See if this is a local service
	if (intRequest.isLocalService(body)) {
		// It's local
		logger.trace('INTERNAL REQUEST');
		intRequest.makeRequest(body).then(function (data) {
				logger.debug('Got internal response');
				callback(data);
			}, function (error) {
				logger.debug('Got internal error', error);
				callback(error);
			}
		);
	} else {
		// This is an external service (like NGT)
		logger.trace('EXTERNAL REQUEST');
		extRequest.makeRequest(body, function (response) {
			callback(response);
		});
	}
};