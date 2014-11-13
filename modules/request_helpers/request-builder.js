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

    var obj = _.extend(defaults, opts);
    obj.servicepath= "api" + opts.servicepath;

    return obj;
}

module.exports = exports = {
    createRequestBody : createRequestBody
};
