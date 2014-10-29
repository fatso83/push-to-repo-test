var log4js = require('log4js');
var logger = log4js.getLogger('Internal Request Resolver');

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
	{name : 'recommendations', method : cachedServiceModule.fetch},
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

exports.makeRequest = function (requestBody, callback) {
	logger.debug('Resolving internally');

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
			serviceId    : requestBody.serviceId,
			response     : {
				code   : 200,
				origin : 'internal',
				data   : {}
			}
		};

		var method = getMethod(requestBody.servicename);

		if (method) {
			method(requestBody, function (response, error) {
				if (error) {
					responseObj.response.data = error.data || {};
					responseObj.response.code = error.code || 500;
					responseObj.response.origin = error.origin || 'internal';
					callback(responseObj);
				} else {
					responseObj.response.data = response;
					responseObj.response.origin = response.origin || 'internal';
					callback(responseObj);
				}
			});
		} else {
			responseObj.response.code = 500;
			responseObj.response.data = 'No service name supplied in request body';
			callback(responseObj);
		}
};