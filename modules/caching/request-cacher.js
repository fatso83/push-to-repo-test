'use strict';

/**
 * Caches results based on the request environment, service path, authorization header , and payload
 * The two last fields are only used if they exist, so they are not compulsory.
 *
 * Requests will have their cache updated once maxAgeInSeconds is surpassed, but only if the request is succesful
 */

var crypto = require('crypto');
var logger = require('log4js').getLogger('RequestCacher');
var utils = require('util');

var basicToken = 'Basic J8ed0(tyAop206%JHP';

function hash(requestBody) {
    
    var requestToken, hashKey, servicePath;

    servicePath = requestBody.servicepath.toLowerCase();
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

    hashKey = 'ng_service_cache_' + (requestBody.environment || "") + "_" + crypto.createHash('sha256').update(servicePath + requestToken + payload).digest('base64');
    return hashKey;
}


/**
 *
 * @param opts.maxAgeInSeconds how long a cached response should be valid before being refreshed
 * @param opts.maxStaleInSeconds how long we are willing to use a stale cache in case of failing service requests
 * @constructor
 */
function RequestCacher(opts) {
    this.maxAge = opts.maxAgeInSeconds || 60 * 60;
    this.maxStale = opts.maxStaleInSeconds || 0;

    if (!opts.stubs) {
        opts.stubs = {};
    }

    this._redisCache = opts.stubs.redisCache || require('./redis-cache');
    this._externalRequest = opts.stubs.externalRequest || require('../request_helpers/externalRequest');
}

RequestCacher.prototype = {

    isOld: function (time) {
        return (Date.now() - time) > this.maxAge * 1000;
    },

    isWithinStaleLimit: function (time) {
        return (Date.now() - this._currentResult.data.cacheTime) < this.maxStale * 1000;
    },

    canUseStaleResult: function () {
        var hasValidResult = this._currentResult && this._currentResult.status === 'success';

        if (!hasValidResult) {
            return false;
        }

        return this.isWithinStaleLimit();
    },

    /**
     *
     * @param fwServiceRequest  see the README for a definition of this format
     * @param callback called with the (possibly cached) result
     */
    handleRequest: function (fwServiceRequest, callback) {
        logger.debug('Handling request for ' + fwServiceRequest.servicename);
        var hashKey, self = this, start = Date.now();

        this._currentResult = null;

        hashKey = hash(fwServiceRequest);
        logger.debug('Key: ', hashKey);

        this._redisCache.get(hashKey, function (reply) {
            var cacheObj = reply.data || null;

            this._currentResult = reply;

            if (reply.status === "success" && cacheObj && !self.isOld(cacheObj.cacheTime)) {

                logger.trace('--> Got cached result in ' + (Date.now()-start) + ' ms');
                callback(cacheObj.response, null);

            } else {
                self.refresh(fwServiceRequest, callback);
            }
        }.bind(this));
    },

    refresh: function (fwServiceRequest, cb) {
        var error, cacheObj = {
            key: hash(fwServiceRequest),
            cacheTime: null,
            response: null
        };

        logger.trace('Getting data from server (using external request)');

        this._externalRequest.makeRequest(fwServiceRequest, function (res) {
            var code = res.response.code;
            logger.trace(utils.format('Got response for %s with code %d', fwServiceRequest.servicename, code));

            if (code === 200 || code === 201 || code === 204) {
                if (res.response.data) {
                    cacheObj.cacheTime = Date.now();
                    cacheObj.response = res.response.data;

                    this._redisCache.cache(cacheObj.key, cacheObj, function (reply) {
                        if(reply.status && reply.status === 'success') {
                            logger.trace('Successful cached ' + cacheObj.key);
                        } else {
                            logger.error('Failed to cache ' + cacheObj.key);
                        }
                    });
                }

            } else if (this.canUseStaleResult()) {
                logger.warn('Request failed. Using stale results for ' + fwServiceRequest.servicename);

                cacheObj.response = this._currentResult.data.response;

            } else {
                logger.error('Request failed. Cannot refresh cache for' + fwServiceRequest.servicename);
                error = res.response;
            }

            cb(cacheObj.response, error);
        }.bind(this));
    }
};

// expose the hash function to make it testable
RequestCacher.hash = hash;

module.exports = RequestCacher;

