exports.verify = function (response) {
    return typeof response.serviceid === 'string' &&
        typeof  response === 'object' &&
        typeof response.code === 'number' &&
        typeof response.origin === 'string' &&
        typeof response.data !== undefined;

};

