var log4js = require('log4js');
var logger = log4js.getLogger('User Token Cache');
var configuration = require('../configuration-loader');
var redis = require("redis");
var SimpleCache = require('../caching/simple-cache');

var redisClient = null;
var memCache = null;

var tokenExpireInYears = 1;
var tokenCacheRedisChannel = 'userTokenStorage';
var redisUserTokenSet = 'userTokens';

var ready = function () {
    return !!(redisClient && memCache);
};

var handleRedisMessage = function (channel, message) {
    if (channel == tokenCacheRedisChannel) {
        saveToken(message, false, function (error) {
            if (!error) {
                logger.trace('Redis Message with user token was saved to mem-cache.')
            } else {
                logger.error(error);
            }
        });
    }
};

var initialMemCache = function (error, result) {
    if (!error) {
        var userTokens = result;
        // TODO: save to memStorage

    } else {
        logger.error(error);
    }
};

var initialize = function () {
    redisClient.on('message', handleRedisMessage);
    redisClient.smembers(redisUserTokenSet, initialMemCache);
};

configuration.load(function (config) {

    memCache = new SimpleCache();

    var redisCredentials = config.caching.redis;
    redisClient = redis.createClient(redisCredentials.port, redisCredentials.host, {
        auth_pass: redisCredentials.key,
        return_buffers: true
    });

    redisClient.on('ready', function (error) {
        if (!error) {
            initialize();
        }
    });
});

var hasExpired = function (jsonDate) {

    var expireDate = null;
    if (jsonDate) {
        try {
            expireDate = JSON.parse(jsonDate);
        } catch (e) {
            return callback(e, null);
        }
    }

    var now = new Date();
    return expireDate <= now;
};

/**
 *
 * @param {string} token
 * @param {function} callback
 * @returns {*}
 */
var hasValidToken = function (token, callback) {
    if (!ready()) {
        return callback(new Error('User token cache is not ready'), null);
    }

    var expireDate = memCache.get(token);
    if (expireDate && !hasExpired(expireDate)) {
        return callback(null, true);
    }

    var startTime = process.hrtime();
    redisClient.get(token, function (error, reply) {
        var diff = process.hrtime(startTime);
        logger.trace('Redis lookup finished in ' + (diff[0] * 1e9 + diff[1]) + ' nanoseconds ');
        return callback(error, !hasExpired(reply));
    });
};

/**
 *
 * @param {string} token
 * @param {boolean} publish
 * @param {function} callback
 */
var saveToken = function (token, publish, callback) {
    if (!ready()) {
        return callback(new Error('User token cache is not ready'), null);
    }

    var expireDate = new Date();
    expireDate.setUTCFullYear(expireDate.getUTCFullYear() + tokenExpireInYears);
    var message = {
        expireDate: expireDate,
        token: token
    };

    memCache.set(token, expireDate);

    if (publish) {
        redisClient.sadd(redisUserTokenSet, function (error) {
            if(!error){
                return callback(error);
            }
        });

        redisClient.publish(tokenCacheRedisChannel, message);
    } else {
        return callback(null);
    }
};

module.exports = {
    hasValidToken: hasValidToken,
    saveToken: saveToken
};
