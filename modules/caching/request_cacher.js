'use strict';

/**
 * Caches results based on the request environment, service path, authorization header , and payload
 * The two last fields are only used if they exist, so they are not compulsory.
 *
 * Requests will have their cache updated once maxAgeInSeconds is surpassed, but only if the request is succesful
 */

//var utils = require('utils');
var crypto = require('crypto');
var logger = require('log4js').getLogger('RequestCacher');
var externalRequest = require('../request_helpers/externalRequest');
var request = require('request');

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
    this.redisCache = opts.redisCache || require('./redisCache');
}

RequestCacher.prototype = {

    isOld: function (time) {
        return (Date.now() - time) > this.maxAge;
    },


    /**
     *
     * @param requestBody {RESTPayload} see the README for a definition of this format
     * @param callback called with the (possibly cached) result
     */
    handleRequest: function (requestBody, callback) {
        var hashKey, self = this;

        hashKey = hash(requestBody);
        logger.debug('The key is', hashKey);

        this.redisCache.get(hashKey, function (reply) {
            var cacheObj = reply || null;
            if (reply.status === "success" && cacheObj && !self.isOld(cacheObj.cacheTime)) {
                logger.trace('----> Returning cached result');
                callback(cacheObj.data.response, null);
            } else {
                this.refresh(requestBody, callback);
            }
        });
    },

    refresh: function (request, cb) {
        var cacheObj = {
            key: hash(request),
            cacheTime: null,
            response: null
        }, error;

        logger.trace('Getting data from server (using external request)');
        externalRequest.makeRequest(request, function (responseObj) {
            var code = responseObj.response.code;
            if (code === 200 || code === 201 || code === 204) {
                if (responseObj.response.data) {
                    cacheObj.response = responseObj.response.data;
                    cacheObj.response.origin = "internal";
                    cacheObj.cacheTime = Date.now();
                    redisCache.cache(cacheObj.key, cacheObj, function (reply) {
                        logger.trace('Did cache result', reply);
                    });
                }
            } else {
                error = responseObj.response;
            }
            cb(cacheObj.response, error);
        });
    }
};

exports = RequestCacher;
