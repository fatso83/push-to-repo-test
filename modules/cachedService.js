'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('Module Service Cacher');

var request = require('request');
var crypto = require('crypto');
var redisCache = require('./redisCache');
var basicToken = 'Basic J8ed0(tyAop206%JHP';
var ONE_HOUR = 60 * 60 * 1000;

var hashObject = {
	key       : "",
	cacheTime : {},
	data      : {}
};

function fetchDataFromServer (requestBody, cacheObj, callback) {
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
				cacheObj.data = body;
				cacheObj.cacheTime = Date.now();

				if (cacheObj.isNew) {
					cacheObj.isNew = false;
					redisCache.cache(cacheObj.key, cacheObj, function (reply) {
						console.log('Did cache result', reply);
					});
				}
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

	hashKey = crypto.createHash('sha256').update(requestBody.environment + requestBody.servicepath + requestToken + payload).digest('base64');

	redisCache.get(hashKey, function (reply) {
		cacheObj = reply || null;
		if (reply.status === "success" && cacheObj && !old(cacheObj.cacheTime)) {
			logger.trace('----> Returning cache');
			callback(cacheObj.data, null);
		} else {
			cacheObj = {
				key       : hashKey,
				cacheTime : null,
				data      : null,
				isNew     : true
			};
			logger.trace('Getting data from server');
			fetchDataFromServer(requestBody, cacheObj, function (response, error) {
				callback(response, error);
			});
		}
	});
};