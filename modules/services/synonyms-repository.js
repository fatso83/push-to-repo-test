var requestBuilder = require('./../request_helpers/request-builder');
var utils = require('../utils');

module.exports = {
    getSynonymsRequest: function (chainId) {
        return requestBuilder.createRequestBody({
            servicename: 'synonyms',
            servicepath: 'api/data/synonyms/' + chainId,
            headers: {
                authorization: utils.basicAuthentication()
            }
        });
    }
};