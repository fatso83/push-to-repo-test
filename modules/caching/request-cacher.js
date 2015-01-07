'use strict';

/**
 * Caches results based on the request environment, service path, authorization header , and payload
 * The two last fields are only used if they exist, so they are not compulsory.
 *
 * Requests will have their cache updated once maxAgeInSeconds is surpassed, but only if the request is successful
 */

var crypto = require('crypto');
var logger = require('log4js').getLogger('RequestCacher');
var util = require('util');
var utils = require('../utils');
var SimpleMemCache = require('./simple-cache');
var userTokenCache = require('./user-token-cache');


function hash(requestBody, userRequest) {

    var requestToken = null,
        hashKey = null,
        servicePath = null;

    servicePath = requestBody.servicepath.toLowerCase();

    // Assume basic token
    requestToken = utils.basicAuthentication();
    requestBody.headers.forEach(function (header) {
        // Overriding in case the request returns unique results for each user (token)
        if (userRequest && header.authorization && (header.authorization.indexOf('Bearer ') > -1)) {
            requestToken = header.authorization;
        }
    });

    var payload = "";
    if (requestBody.payload) {
        payload = JSON.stringify(requestBody.payload);
    }

    hashKey = 'ng_service_cache_' + (requestBody.environment || "") + "_" + crypto.createHash('sha256').update(servicePath + requestToken + payload).digest('base64');
    return hashKey;
}

function validBasicAuthenticationHeader(request) {
    if (request.headers && Array.isArray(request.headers)) {
        for (var i = 0; i < request.headers.length; i++) {
            var header = request.headers[i];
            if (header.authorization) {
                if (header.authorization.indexOf('Basic') > -1) {
                    return header.authorization === utils.basicAuthentication();
                }
                // Also check if user has a bearer token

                if (header.authorization.indexOf('Bearer') > -1) {
                    return true;
                    /*
                     var bearerToken = header.authorization.replace('Bearer ', '');
                     userTokenCache.hasValidToken(bearerToken, function (error, result) {
                     return !!(!error && result);
                     });
                     */
                }

            }
        }
    }
}

/**
 *
 * @param opts.maxAgeInSeconds how long a cached response should be valid before being refreshed
 * @param opts.maxStaleInSeconds how long we are willing to use a stale cache in case of failing service requests
 * @param {boolean} opts.useInMemCache
 * @constructor
 */
function RequestCacher(opts) {
    opts = opts || {};
    this.maxAge = opts.maxAgeInSeconds || 60 * 60;
    this.maxStale = opts.maxStaleInSeconds || 0;
    this.useInMemCache = !!opts.useInMemCache || false;
    this.basicToken = !!opts.basicToken;
    this.bearerToken = !!opts.bearerToken;
    this.requireBearerToken = !!opts.requireBearerToken;

    if (!opts.stubs) {
        opts.stubs = {};
    }

    this._redisCache = opts.stubs.redisCache || require('./redis-cache');
    this._externalRequest = opts.stubs.externalRequest || require('../request_helpers/external-request');
    this._memCache = opts.stubs.memCache || SimpleMemCache.getSharedInstance();
}


RequestCacher.prototype = {

    updateMemCache: function (cacheObj) {
        if (this.useInMemCache) {
            this._memCache.set(cacheObj.key, cacheObj);
        }
    },

    isOld: function (time) {
        return (Date.now() - time) > this.maxAge * 1000;
    },

    isWithinStaleLimit: function () {
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
        var hashKey,
            self = this,
            start = Date.now(),
            cachedObj = null;

        this._currentResult = null;

        hashKey = hash(fwServiceRequest, this.bearerToken);
        logger.debug('Key: ', hashKey, '(' + fwServiceRequest.servicepath + ')');

        // refresh if we don´t have a valid authentication header
        if (this.basicToken && !validBasicAuthenticationHeader(fwServiceRequest)) {
            fwServiceRequest.hashKey = hashKey;
            return self.refresh(fwServiceRequest, callback);
        }

        // return early if we have a fresh, in-mem cached version
        cachedObj = this._memCache.get(hashKey);
        if (cachedObj && !this.isOld(cachedObj.cacheTime)) {
            logger.trace('Using in-mem cache for ' + hashKey);
            return callback(cachedObj.response);
        }

        this._redisCache.get(hashKey, function (reply) {
            cachedObj = reply.data || null;
            this._currentResult = reply;
            if (reply.status === "success" && cachedObj && !self.isOld(cachedObj.cacheTime)) {
                logger.trace('--> Got cached result in ' + (Date.now() - start) + ' ms');
                return callback(cachedObj.response, null);
            } else {
                fwServiceRequest.hashKey = hashKey;
                return self.refresh(fwServiceRequest, callback);
            }
        }.bind(this));
    },

    /**
     *
     * @param {object} fwServiceRequest
     * @param {string} fwServiceRequest.hashKey
     * @param callback
     */
    refresh: function (fwServiceRequest, callback) {

        var error,
            cacheObj = {
                key: null,
                cacheTime: null,
                response: null
            };

        if (fwServiceRequest.hashKey) {
            cacheObj.key = fwServiceRequest.hashKey;
        } else {
            cacheObj.key = hash(fwServiceRequest);
        }

        logger.trace('Getting data from server (using external request)');

        this._externalRequest.makeRequest(fwServiceRequest, function (res) {
            var code = res.response.code;
            logger.trace(util.format('Got response for %s with code %d', fwServiceRequest.servicename, code));

            if (code === 200 || code === 201 || code === 204) {
                if (res.response.data) {
                    cacheObj.cacheTime = Date.now();
                    cacheObj.response = res.response.data;

                    this.updateMemCache(cacheObj);

                    this._redisCache.cache(cacheObj.key, cacheObj, function (reply) {
                        if (reply.status && reply.status === 'success') {
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
                logger.error('Request failed. Cannot refresh cache for ' + fwServiceRequest.servicename);
                error = res.response;
            }

            callback(cacheObj.response, error);
        }.bind(this));
    }
};

// expose the hash function to make it testable
RequestCacher.hash = hash;

module.exports = RequestCacher;