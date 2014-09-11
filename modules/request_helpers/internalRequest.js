var log4js = require('log4js');
var logger = log4js.getLogger('Internal Request Resolver');
var Promise = require("es6-promise").Promise;

var productSearchModule = require('./../productSearch/searchUtil');
var trumfTermsAndConditionsModule = require('./../terms_caching/terms_cacher');
var persistenceSyncModule = require('./../synchronize/request-adapter');
var cachedServiceModule = require('./cachedService');

var localServices = [
	{name : 'persistenceSynchronize', method : persistenceSyncModule.synchronize},
	{name : 'trumfProfile_termsAndConditions', method : trumfTermsAndConditionsModule.fetch},
	{name : 'productSearchProducts', method : productSearchModule.search},
	{name : 'productSearchGroups', method : productSearchModule.search},
	{name : 'productSearchBoth', method : productSearchModule.search},
	{name : 'productSearchGetProductsForGroup', method : productSearchModule.search},
	{name : 'productSearchGetAllCategories', method : productSearchModule.search},
	{name : 'productSearchGetProductById', method : productSearchModule.search},
	{name : 'productDetails2', method : cachedServiceModule.fetch},
	{name : 'storesGetStore', method : cachedServiceModule.fetch},
	{name : 'brandMatch', method : cachedServiceModule.fetch}
];

exports.isLocalService = function (requestBody) {
	var serviceName = requestBody.servicename;

	var i = localServices.length;
	while (i--) {
		if (localServices[i].name === serviceName) {
			return true;
		}
	}
	return false;
};

exports.makeRequest = function (requestBody) {
	logger.debug('Resolving internally', requestBody);

	return new Promise(function (resolve, reject) {
		function getMethod (serviceName) {
			var i = localServices.length;
			while (i--) {
				if (localServices[i].name === serviceName) {
					return localServices[i].method;
				}
			}
			return false;
		}

		var responseObj = {
			serviceid : requestBody.serviceid,
			socketid  : requestBody.socketid || null,
			response  : {
				code   : 200,
				origin : 'internal',
				data   : {}
			}
		};

		var method = getMethod(requestBody.servicename);

		if (method) {
			method(requestBody, function (response, error) {
				if (error) {
					responseObj.response.data = error;
					responseObj.response.code = 500;
					reject(error);
				} else {
					responseObj.response.data = response;
					resolve(responseObj);
				}
			});
		} else {
			responseObj.response.code = 500;
			reject(responseObj);
		}
	});
};