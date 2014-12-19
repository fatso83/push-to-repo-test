/**
 * Service to calculate the closest stores from some point
 */

var geolib = require('geolib');
var util = require('./store-utils');
var repository;
var log4js = require('log4js');
var logger = log4js.getLogger('Store service');
var _ = require('lodash');

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

    repository.getStores(chainId, function (err, stores) {

        if (err) {
            return callback(err);
        }

        callback(null, _.find(stores, function (store) {
            return store.id === storeId;
        }) );
    });
}


function getClosestStores(chainId, latitude, longitude, minNumberOfStores, maxNumberOfStores, maxDistance, filter, callback) {

    var myPos = {
        "latitude": latitude,
        "longitude": longitude
    };

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

        util.applyTodaysOpeningHours(new Date(), storesWithDistance);

        callback(null, storesWithDistance);
    });
}

exports.getClosestStores = getClosestStores;
exports.getSingleStore = getSingleStore;

exports.setRepository = function (repo) {
    repository = repo;
};