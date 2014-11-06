'use strict';

/**
 * Caches results based on the request environment, service path, authorization header , and payload
 * The two last fields are only used if they exist, so they are not compulsory.
 *
 * Requests will have their cache updated once maxAgeInSeconds is surpassed, but only if the request is succesful
 */

var crypto = require('crypto');
var logger = require('log4js').getLogger('RequestCacher');

var basicToken = 'Basic J8ed0(tyAop206%JHP';


function hash(requestBody) {
    var requestToken, hashKey;

    requestToken = basicToken;
    requestBody.headers.forEach(function (header) {
        if (header.Authorization) {
            requestToken = header.Authorization;
        }
    });

    var payload = "";
    if (requestBody.payload) {
        payload = JSON.stringify(requestBody.payload);
    }

    hashKey = 'ng_service_cache_' + (requestBody.environment || "") + "_" + crypto.createHash('sha256').update(requestBody.servicepath + requestToken + payload).digest('base64');

    return hashKey;
}


//function refresh(req) {
//    console.log(utils.format('Cached %s call: %s', this.request.servicename, this.request.servicepath));
//}

function RequestCacher(opts) {
    this.maxAge = opts.maxAgeInSeconds || 60 * 60 * 24;

    if (!opts.stubs) { opts.stubs = {}; }

    this._redisCache = opts.stubs.redisCache || require('./redisCache');
    this._externalRequest = opts.stubs.externalRequest || require('../request_helpers/externalRequest');
}

RequestCacher.prototype = {

    isOld: function (time) {
        return (Date.now() - time) > this.maxAge*1000;
    },


    /**
     *
     * @param fwServiceRequest  see the README for a definition of this format
     * @param callback called with the (possibly cached) result
     */
    handleRequest: function (fwServiceRequest, callback) {
        var hashKey, self = this;

        hashKey = hash(fwServiceRequest);
        logger.debug('The key is', hashKey);

        this._redisCache.get(hashKey, function (reply) {
            var cacheObj = reply.data || null;
            if (reply.status === "success" && cacheObj && !self.isOld(cacheObj.cacheTime)) {
                logger.trace('----> Returning cached result');
                callback(cacheObj.response, null);
            } else {
                self.refresh(fwServiceRequest, callback);
            }
        });
    },

    refresh: function (fwServiceRequest, cb) {
        var cacheObj = {
            key: hash(fwServiceRequest),
            cacheTime: null,
            response: null
        }, error;

        logger.trace('Getting data from server (using external request)');
        this._externalRequest.makeRequest(fwServiceRequest, function (responseObj) {
            logger.trace('Got response', responseObj);
            var code = responseObj.response.code;

            if (code === 200 || code === 201 || code === 204) {
                if (responseObj.response.data) {
                    cacheObj.response = responseObj.response.data;
                    cacheObj.response.origin = "internal";
                    cacheObj.cacheTime = Date.now();
                    this._redisCache.cache(cacheObj.key, cacheObj, function (reply) {
                        logger.trace('Did cache result', reply);
                    });
                }
            } else {
                error = responseObj.response;
            }
            cb(cacheObj.response, error);
        }.bind(this));
    }
};

module.exports = RequestCacher;
