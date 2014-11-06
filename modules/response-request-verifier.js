/**
 * Validate the wrapped requests and responses
 */

exports.validateRequest = function (req) {
    return  typeof req.servicepath === 'string' &&
        typeof req.servicename === 'string' &&
        typeof req.frameworkVersion === 'string';
};

exports.validateResponse = function (response) {
    var unwrapped = response.response;
    return  typeof unwrapped.code === 'number' &&
        typeof unwrapped.origin === 'string' &&
        typeof unwrapped.data !== 'undefined';

};

