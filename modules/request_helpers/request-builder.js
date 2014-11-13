var _ = require('lodash');

function createRequestBody(opts) {
    if(!( ('servicename' in opts) && ('servicepath' in opts))) {
        throw new Error('Compulsory keys missing');
    }

    var defaults = {
        "environment": "preprod",
        "frameworkVersion": "5.0.0",
        "headers": []
    };

    return _.extend(defaults, opts);
}

module.exports = exports = {
    createRequestBody : createRequestBody
};
