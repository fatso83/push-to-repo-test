'use strict';

// This will cache ProductDetailList calls for users whom are not logged in

var request = require('request');
var basicToken = 'Basic J8ed0(tyAop206%JHP';
var pdlCache;
var cacheTime;
var ONE_HOUR = 60 * 60 * 1000;

function fetchProductDetails(requestBody, callback) {
	var uri = "";
	if(requestBody.environment === 'production') {
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
		url: uri,
		headers: headers,
		method: 'POST',
		json: requestBody.payload
	};

	request(options, function(error, response, body) {
		if(error) {
			callback(null, {error: "Server malfunction"});
		} else {
			if(response.statusCode === 200) {
				pdlCache = body;
				cacheTime = Date.now();
				callback(body, null);
			} else {
				callback(null, {error: body});
			}
		}
	});
}

function old () {
	return (Date.now() - cacheTime) > ONE_HOUR;
}

exports.fetch = function (requestBody, callback) {
	var requestToken;

	requestBody.headers.forEach(function(header) {
		if(header.Authorization) {
			requestToken = header.Authorization;
		}
	});

	if (!pdlCache || old() || (requestToken !== basicToken)) {
		fetchProductDetails(requestBody, function (response, error) {
			callback(response, error);
		});
	}
	else {
		callback(pdlCache, null);
	}
};