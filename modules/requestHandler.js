exports.handleRequest = function(body) {
	// See if this is a local service
	if (intRequest.isLocalService(body)) {
		// It's local
		logger.debug('INTERNAL REQUEST');
		intRequest.makeRequest(body).then(function (data) {
				logger.debug('Got internal response');
				res.json(data);
			}, function (error) {
				res.status(500).json(error);
			}
		);
	} else {
		// This is an external service (like NGT)
		logger.debug('EXTERNAL REQUEST');
		extRequest.makeRequest(body, function (response) {
			logger.debug('Got external response');
			res.json(response);
		});
	}
};