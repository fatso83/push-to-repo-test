/**
 * Service to calculate the closest stores from some point
 */

var geolib = require('geolib');
var moment = require('moment-timezone');
var util = require('./store-utils');
var repository;
var log4js = require('log4js');
var logger = log4js.getLogger('Store service');

repository = require('./store-repository.js');

function createStoreDistanceObject(storeObject, distance) {
    return {
        "distance": distance,
        "store": storeObject
    };
}


function getSingleStore(chainId, storeId, callback) {

    if (!storeId) {
        return callback(new TypeError('Missing parameter storeId'));
    }

    var foundstore = {};

    repository.getStores(chainId, function (err, stores) {

        if (err) {
            return callback(err);
        }

        var storeArray = stores;
        var i = storeArray.length;
        while (i--) {
            var store = storeArray[i];
            if (store && store.id === storeId) {
                foundstore = store;
                break;
            }
        }

        callback(null, foundstore);
    });
}


function getClosestStores(chainId, latitude, longitude, minNumberOfStores, maxNumberOfStores, maxDistance, filter, callback) {
    var myPos = {"latitude": latitude, "longitude": longitude};

    repository.getStores(chainId, function (err, stores) {

        if (err) {
            return callback(err);
        }

        var storesWithDistance = stores.filter(function (store) {
            return util.isValidLocation(store.location);
        }).map(function (store) {
            var distance = geolib.getDistance(myPos, store.location) / 1000;
            return createStoreDistanceObject(store, distance);
        });


        storesWithDistance.sort(function (a, b) {
            return a.distance - b.distance;
        });

        storesWithDistance = util.filterByOpeninghours(storesWithDistance, filter);
        storesWithDistance = util.filterByLimits(storesWithDistance, minNumberOfStores, maxNumberOfStores, maxDistance);

        var today = moment().tz("Europe/Oslo");
        util.applyTodaysOpeningHours(today, storesWithDistance);

        callback(null, storesWithDistance);
    });
}

exports.getClosestStores = getClosestStores;
exports.getSingleStore = getSingleStore;

exports.setRepository = function (repo) {
    repository = repo;
};