var requestBuilder = require('./../request_helpers/request-builder');
var utils = require('../utils');

module.exports = {
    getVacancyRequest: function (chainId) {
        return requestBuilder.createRequestBody({
            servicename: 'shoppingListGroup',
            servicepath: 'api/data/vacancies/' + chainId,
            headers: {
                authorization: utils.basicAuthentication()
            }
        });
    }
};