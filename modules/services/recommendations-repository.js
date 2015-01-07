var requestBuilder = require('./../request_helpers/request-builder');
var utils = require('../utils');

module.exports = {
    getRecommendationsRequest: function (chainId) {
        return requestBuilder.createRequestBody({
            servicename: 'recommendations',
            servicepath: 'api/uidata/recommendations/' + chainId,
            headers: {
                authorization: utils.basicAuthentication()
            }
        });
    }
};