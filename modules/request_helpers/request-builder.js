var _ = require('lodash'),
    config;

/*
 *  Async operation, but we expect it to be loaded by app.js by now, effectively
 *  making it a synchronous request
 */
require('../configuration-loader').load(function(loadedConfig){
   config = loadedConfig;
});

function createRequestBody(opts) {
    if(!( ('servicename' in opts) && ('servicepath' in opts))) {
        throw new Error('Compulsory keys missing');
    }

    var defaults = {
        "environment": config.caching.environment,
        "frameworkVersion":  config['minimum framework version'],
        "headers": []
    };

    return _.extend(defaults, opts);
}

module.exports = exports = {
    createRequestBody : createRequestBody,

    // for testing
    setConfig : function(fakeConfig) {
        config = fakeConfig;
    }
};
