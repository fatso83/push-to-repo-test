var requestBuilder = require('./../request_helpers/request-builder');
var utils = require('../utils');

module.exports = {
    getShoppingListGroupRequest: function (chainId) {
        return requestBuilder.createRequestBody({
            servicename: 'shoppingListGroup',
            servicepath: 'api/data/shoppinglistgroup/' + chainId,
            headers: {
                authorization: utils.basicAuthentication()
            }
        });
    }
};