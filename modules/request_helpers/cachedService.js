'use strict';

var externalRequest = require('./externalRequest');

var log4js = require('log4js');
var logger = log4js.getLogger('Module Service Cacher');

var request = require('request');
var crypto = require('crypto');
var redisCache = require('./../redisCache');
var basicToken = 'Basic J8ed0(tyAop206%JHP';
var CACHE_TIME = (60 * 60 * 1000) * 24; // One day

var hashObject = {
	key       : "",
	cacheTime : {},
	data      : {}
};

function old (time) {
	return (Date.now() - time) > CACHE_TIME;
}

exports.fetch = function (requestBody, callback) {
	var requestToken, hashKey, cacheObj, error;
	error = null;

	requestToken = basicToken;
	requestBody.headers.forEach(function (header) {
		if (header.Authorization) {
			requestToken = header.Authorization;
		}
	});

	var payload = "";
	if (requestBody.payload) {
		payload = JSON.stringify(requestBody.payload);
	}

	hashKey = 'ng_service_cache_' + (requestBody.environment || "") + "_" + crypto.createHash('sha256').update(requestBody.servicepath + requestToken + payload).digest('base64');
	logger.debug('The key is', hashKey);

	redisCache.get(hashKey, function (reply) {
		cacheObj = reply || null;
		if (reply.status === "success" && cacheObj && !old(cacheObj.cacheTime)) {
			logger.trace('----> Returning cached result');
			callback(cacheObj.data.response, null);
		} else {
			cacheObj = {
				key       : hashKey,
				cacheTime : null,
				response  : null
			};
			logger.trace('Getting data from server (using external request)');
			externalRequest.makeRequest(requestBody, function(responseObj) {
				logger.trace('Got data from server');
				var code = responseObj.response.code;
				if(code === 200 || code === 201 || code === 204) {
					if(responseObj.response.data) {
						cacheObj.response = responseObj.response.data;
						cacheObj.cacheTime = Date.now();
						redisCache.cache(cacheObj.key, cacheObj, function (reply) {
							logger.trace('Did cache result', reply);
						});
					}
				} else {
					error = responseObj.response;
				}
				callback(cacheObj.response, error);
			});
		}
	});
};