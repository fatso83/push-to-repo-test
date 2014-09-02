var request = require('request');

var log4js = require('log4js');
var logger = log4js.getLogger('Module External Request');

var asJson = JSON.stringify;


exports.makeRequest = function (requestData, callback) {
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
		serviceid : requestData.serviceid,
		socketid  : requestData.socketid || null,
		response  : {
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
		method  : requestData.servicemethod || 'GET'
	};

	logger.debug('sender til ' + options.uri);

	if (requestData.servicemethod === 'POST') {
		options.json = requestData.payload || "";
	}

	options.startTime = new Date().getTime();

	logger.debug('<--- Request -->');
	logger.debug(options);
	logger.debug('<-------------->');

	request(options, function (error, response, body) {
		logger.debug('Request callback');

		if (error) {
			logger.error('Got error', asJson(error));
			responseObj.response.status = 500;
			responseObj.response.data = {message : "Server not found"};
			callback(responseObj);
			return;
		}

		try {
			logger.debug('Got response from service, status', response.statusCode);
			logger.debug('The response is of type', typeof body);

			responseObj.response.code = response.statusCode;
			responseObj.response.data = JSON.parse(body);

			callback(responseObj);
		} catch (err) {
			logger.error('Caught error processing request', err);
		}
	});
};