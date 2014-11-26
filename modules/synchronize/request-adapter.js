/**
 * @param requestBody as from the framework. the actual body is in payload
 * @param callback reverse parameter order of Node convention function(result, error)
 */

var module = require('./service');

exports.synchronize = function (requestBody, callback) {

	var chainId, userId, clientData;

	chainId = requestBody.chainId;
	userId = requestBody.servicepath.match(/.*\/([0-9]+)$/)[1];
	clientData = requestBody.payload;

	module.synchronize(chainId, userId, clientData, function(err, res) {
		callback(res, err);
	});
};
