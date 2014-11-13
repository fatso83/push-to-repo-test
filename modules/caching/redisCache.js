"use strict";

var log4js = require('log4js');
var logger = log4js.getLogger('Redis Cache');

/**
 * The object returned in the callback method
 */
var callbackObj = {
	status : "success | error",
	data   : null,
	error  : null
};

var redis_lib = require("redis");

logger.trace('Initializing redis');

var cli = redis_lib.createClient(6379, 'ngredisdev.redis.cache.windows.net',
	{auth_pass : '5SziauARAm7mWus0zl3sfv4OwccMVEtwIh5vMgp/D7c=', return_buffers : true});


function on_error (error) {
	logger.error('Redis error', error);
}
function on_connect () {
	logger.trace('Redis connected');
}
function on_drain () {
	logger.trace('Redis drain');
}
function on_idle () {
	logger.trace('Redis idle');
}
function on_end () {
	logger.trace('Redis end');
}
cli.on('connect', on_connect);
cli.on('error', on_error);
cli.on('drain', on_drain);
cli.on('idle', on_idle);
cli.on('end', on_end);
cli.on('ready', logger.info.bind(logger,'Redis ready'));

/**
 * Save data to redis cache
 * @param key - The key of the data to fetch
 * @param data - Data to save (object, string whatever)
 * @param callback(callbackObj)
 */
exports.cache = function (key, data, callback) {
	if (key && (typeof key === 'string') && data && callback && (typeof callback === 'function')) {
		var toSave = JSON.stringify(data);
		cli.set(key, toSave, function (err, reply) {
			var status = "success";
			var error = null;
			if (err) {
				status = "error";
				error = err;
			}
			callback({
				status : status,
				error  : error
			});
		});
	} else {
		callback({
			status : "error",
			error  : "Missing parameters (key, data, callback)"
		});
	}

};

/**
 * Fetches data from Redis cache
 * @param key - The key of the data to fetch
 * @param callback(callbackObj)
 */
exports.get = function (key, callback) {

	if (key && (typeof key === 'string') && callback && (typeof callback === 'function')) {
		cli.get(key, function (err, reply) {
			var cbo = {
				status : "success",
				data   : null,
				error  : null
			};
			if (err || reply === null) {
				cbo.status = "error";
				if (err) {
					cbo.error = err;
				} else {
					cbo.error = "Key not found";
				}
			} else {
				cbo.data = JSON.parse((reply || "").toString());
			}
			callback(cbo);
		});
	} else {
		callback({
			status : "error",
			error  : "Missing parameters (key, callback)"
		});
	}
};
