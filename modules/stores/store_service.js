/**
 * Service to calculate the closest stores from some point
 */

var geolib = require('geolib');
var moment = require('moment-timezone');
var util = require('./store-utils');
var repository;
var log4js = require('log4js');
var logger = log4js.getLogger('Store service');

var inMemRepo = {
    getStores: function repository(chainId, cb) {
        cb(require('../../spec/stores/fixtures/kiwistores'));
    }
};

repository = require('./store-repository.js');
//repository = inMemRepo; 

function getSingleStore(chainId, storeId, callback) {

    var foundstore = {};
    var err;
    try {
        if (storeId) {

            repository.getStores(chainId, function(stores) {

                if (stores.response.code != "200") {
                    throw new Error("Service returned... " + JSON.stringify(stores.response));
                }

                var storeArray = stores.response.data;
                var i = storeArray.length;
                while (i--) {
                    var store = storeArray[i];
                    logger.info(store.id);
                    if (store && store.id == storeId) {
                        foundstore = store;
                        break;
                    }
                }
                if (callback)
                    callback(foundstore, null);
            });
        }
    } catch (err) {
        callback(null, err);
    }
}



// TODO: parametres as object would be prettier
function getClosestStores(chainId, latitude, longitude, minNumberOfStores, maxNumberOfStores, maxDistance, filter, callback) {
    var myPos = { "latitude": latitude, "longitude": longitude };

    // TODO: lage en var av validert stores
    repository.getStores(chainId, function(stores) {

        if (stores.response.code != "200") {
            throw new Error("Service returned... " + JSON.stringify(stores.response));
        }

        var i = stores.response.data.length;
        var storeArray = [];
        while (i--) {
            var store = stores.response.data[i];
            var distance,
                location = store.location;

            var haslocation = util.isValidLocation(location);
            if (!haslocation)
                continue;

            distance = geolib.getDistance(myPos, location) / 1000;
            storeArray.push(createStoreDistanceObject(store, distance));

        }

        if (storeArray.length > 0) {

            storeArray.sort(function(a, b) {
                return a.distance - b.distance;
            });

            storeArray = util.filterByOpeninghours(storeArray, filter);
            storeArray = util.filterByLimits(storeArray, minNumberOfStores, maxNumberOfStores, maxDistance);
            //storeArray = util.limitNumberOfSpecialOpeningHoursAhead(storeArray, 35);

            var today = moment().tz("Europe/Oslo");
            util.applyTodaysOpeningHours(today, storeArray);
        }
        if (callback)
            callback(storeArray);
    });
}

function createStoreDistanceObject(storeObject, distance) {
    return {
        "distance": distance,
        "store": storeObject
    };
}

exports.getClosestStores = getClosestStores;
exports.getSingleStore = getSingleStore;

exports.setRepository = function(repo) {
    repository = repo;
};