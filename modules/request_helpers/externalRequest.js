'use strict';

var request = require('request');
var util = require('util');

var log4js = require('log4js');
var logger = log4js.getLogger('Module External Request');

var asJson = JSON.stringify;

var makeRequest = function (requestData, callback) {
	logger.debug('Resolving request');

	var baseURL = "https://preprod.service-dk.norgesgruppen.no/";

	var isOauth = false;
	if (requestData.servicepath.toLowerCase().indexOf('oauth/') > -1) {
		isOauth = true;
	}

	if (requestData.environment === 'preproduction' || requestData.environment === 'local') {
		if (isOauth) {
			baseURL = "https://preprod.oauth.norgesgruppen.no/";
		} else {
			baseURL = "https://preprod.service-dk.norgesgruppen.no/";
		}
	} else if (requestData.environment === 'production') {
		if (isOauth) {
			baseURL = "https://oauth.norgesgruppen.no/";
		} else {
			baseURL = "https://service-dk.norgesgruppen.no/";
		}
	} else if (isOauth) {
		baseURL = "https://preprod.oauth.norgesgruppen.no/";
	}

	var responseObj = {
		serviceId    : requestData.serviceId,
		response     : {
			code   : 0,
			origin : 'ngt',
			data   : {}
		}
	};

	var headers = {};
	requestData.headers.forEach(function (header) {
		var h = Object.keys(header);
		headers[h[0]] = header[h[0]];
	});

	var options = {
		uri     : baseURL + requestData.servicepath,
		headers : headers,
		timeout : 25000, // Timeout after 25 sec
		method  : requestData.servicemethod || 'GET'
	};

	logger.debug('POSTing to: ' + options.uri);

	if (requestData.servicemethod === 'POST') {
		options.json = requestData.payload || "";
	}

	options.startTime = Date.now();

	logger.debug(options);

	request(options, function (error, response, body) {

		if (error) {
			logger.error('Got error', asJson(error));
			if (error.code && error.code === "ETIMEDOUT") {
				responseObj.response.code = 408;
				responseObj.response.data = {message : "Request timeout"};
			} else {
				responseObj.response.code = 500;
				responseObj.response.data = {message : "Server not found"};
			}

			callback(responseObj);
			return;
		}

		try {
			logger.trace(util.format('Got response for %s with code %d (%d KB)', requestData.servicename, response.statusCode, Math.round(body.length/1024)));

			responseObj.response.code = response.statusCode;

			if (typeof body === 'string') {
				try {
					responseObj.response.data = JSON.parse(body);
				} catch (err) {
					responseObj.response.data = body;
				}
			} else {
				responseObj.response.data = body;
			}
		} catch (err) {
			logger.error('Caught error processing request', err);
			responseObj.response.code = 500;
			responseObj.response.data = {error : "Error processing response from NGT service"};
		}

		callback(responseObj);
	});
};

exports.makeRequest  = makeRequest;
