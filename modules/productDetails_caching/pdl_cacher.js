'use strict';

// This will cache ProductDetailList calls for users whom are not logged in

var request = require('request');
var hash = require('hash-string');
var basicToken = 'Basic J8ed0(tyAop206%JHP';
var pdlCache = [];
var ONE_HOUR = 60 * 60 * 1000;

var hashObject = {
	key       : "",
	cacheTime : {},
	data      : {}
};

function fetchProductDetails (requestBody, cacheObj, callback) {
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
		method  : 'POST',
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
					pdlCache.push(cacheObj);
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

function getCacheByKey (key) {
	var i = pdlCache.length;

	while (i--) {
		if (pdlCache[i].key === key) {
			return pdlCache[i];
		}
	}

	return false;
}

exports.fetch = function (requestBody, callback) {
	var requestToken, hashKey, cacheObj;

	requestToken = basicToken;
	requestBody.headers.forEach(function (header) {
		if (header.Authorization) {
			requestToken = header.Authorization;
		}
	});

	hashKey = hash.hashCode(requestBody.servicepath + requestToken);
	cacheObj = getCacheByKey(hashKey);

	if (cacheObj && !old(cacheObj.cacheTime)) {
		callback(cacheObj.data, null);
	}
	else {
		cacheObj = {
			key       : hashKey,
			cacheTime : null,
			data      : null,
			isNew     : true
		};
		fetchProductDetails(requestBody, cacheObj, function (response, error) {
			callback(response, error);
		});
	}
};