var request = require('request');
var basicToken = 'Basic J8ed0(tyAop206%JHP';
var termsCache;
var cacheTime;
var ONE_HOUR = 60 * 60 * 1000;
var ngServer = "https://preprod.service-dk.norgesgruppen.no";
var uri = ngServer + '/trumf/betingelser';

'use strict';

function fetchTermsAndConditions (callback) {
	console.log('Fetching terms');
	request.get({
			url     : uri,
			headers : {
				'Content-Type'  : 'text/html',
				'Authorization' : basicToken
			}
		},

		function (error, res, body) {
			if (error) {
				callback(error);
				return;
			}

			var code = res.statusCode;
			if (code >= 200 && code <= 300) {
				if (body) {
					console.log('Fetched terms and conditions');

					termsCache = body;
					cacheTime = Date.now();

					callback(null, body);
				}
				else {
					callback(new Error('Empty body returned'));
				}
			} else {
				callback(new Error('Unexpected status code: ' + code));
			}
		});
}

function old () {
	return (Date.now() - cacheTime) > ONE_HOUR;
}

module.exports = {
	fetch : function (callback) {

		if (!termsCache || old()) {
			fetchTermsAndConditions(function (err) {
				if (err) {
					console.error(err);
				} else {
					callback(null, termsCache || 'Waiting for update');
				}
			})
		}
		else {
			callback(null, termsCache)
		}
	}
};
