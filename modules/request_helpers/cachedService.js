'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('Module Service Cacher');

var request = require('request');
var crypto = require('crypto');
var redisCache = require('./../redisCache');
var basicToken = 'Basic J8ed0(tyAop206%JHP';
var ONE_HOUR = 60 * 60 * 1000;

var hashObject = {
	key       : "",
	cacheTime : {},
	data      : {}
};

function fetchDataFromServer (requestBody, callback) {
	var uri = "";
	if (requestBody.environment === 'production') {
		uri = "https://service-dk.norgesgruppen.no/" + requestBody.servicepath;
	} else {
		uri = "https://preprod.service-dk.norgesgruppen.no/" + requestBody.servicepath;
	}


	var headers = {};
	requestBody.headers.forEach(function (header) {
		var h = Object.keys(header);
		headers[h[0]] = header[h[0]];
	});
	var options = {
		url     : uri,
		headers : headers,
		method  : requestBody.servicemethod,
		json    : requestBody.payload
	};
	request(options, function (error, response, body) {
		if (error) {
			callback(null, {error : "Server malfunction"});
		} else {
			if (response.statusCode === 200) {
				callback(body, null);
			} else {
				callback(null, {error : body});
			}
		}
	}.bind(this));
}

function old (time) {
	return (Date.now() - time) > ONE_HOUR;
}

exports.fetch = function (requestBody, callback) {
	var requestToken, hashKey, cacheObj;

	requestToken = basicToken;
	requestBody.headers.forEach(function (header) {
		if (header.Authorization) {
			requestToken = header.Authorization;
		}
	});

	var payload = "";
	if(requestBody.payload) {
		payload = JSON.stringify(requestBody.payload);
	}

	hashKey = 'service_cache_' + (requestBody.environment || "") + "_" + crypto.createHash('sha256').update(requestBody.servicepath + requestToken + payload).digest('base64');
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
				data      : null
			};
			logger.trace('Getting data from server');
			fetchDataFromServer(requestBody, function (response, error) {

				if(response) {
					cacheObj.response = response;
					cacheObj.cacheTime = Date.now();
					redisCache.cache(cacheObj.key, cacheObj, function (reply) {
						console.log('Did cache result', reply);
					});
				}

				callback(response, error);
			});
		}
	});
};