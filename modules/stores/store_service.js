/**
 * Service to calculate the closest stores from some point
 */

var geolib = require('geolib');
var repository;

var inMemRepo = {
    getStores: function repository(cb) {
        cb(require('./data/kiwistores'));
    }
};

repository = require('./store-repository.js');

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function filterByLimits(storeArray, minNumberOfStores, maxNumberOfStores, maxDistance) {

    if (maxDistance === 0 && maxNumberOfStores === 0 || minNumberOfStores === storeArray.length) {
        return storeArray;
    }

    for (var i = minNumberOfStores; i < storeArray.length; i++) {

        // frontend expects distance in kilometers, in spite of passing metres in
        if (maxDistance !== 0 && storeArray[i].distance * 1000 > maxDistance) {
            return storeArray.slice(0, i);
        }

        // using '+' ahead of 'i' in order to avoid string concat instead of sum
        if (maxNumberOfStores !== 0 && ( +i + 1 - minNumberOfStores) >= maxNumberOfStores) {
            return storeArray.slice(0, i);
        }

    }

    return storeArray;
}

function createStoreDistanceObject(storeObject, distance) {
    return {
        "distance": distance,
        "store": storeObject
    };
}

function filterOnOpenLate(storeArray) {

    return storeArray.filter(function (elem) {

        if (elem && elem.store && elem.store.openinghours) {
            return elem.store.openinghours.isopenlate;
        }

        return false;
    });
}

function filterOnOpenSunday(storeArray) {
    return storeArray.filter(function (elem) {
        if (elem && elem.store && elem.store.openinghours) {
            return elem.store.openinghours.isopenonsunday;
        }
        return false;
    });
}


function filterByOpeninghours(storeArray, filter) {
    if (filter) {
        if (filter.toLowerCase() === "isopenlate") {
            return filterOnOpenLate(storeArray);
        }

        if (filter.toLowerCase() === "isopensunday") {
            return filterOnOpenSunday(storeArray);
        }
    }
    return storeArray;
}


function getClosestStores(chainId, latitude, longitude, minNumberOfStores, maxNumberOfStores, maxDistance, filter, callback) {
    var myPos = {"latitude": latitude, "longitude": longitude};
    var FAR_FAR_AWAY = Math.pow(10, 100);

    repository.getStores(chainId, function (stores) {

        var storeArray = [];
        if (stores.response.code != "200")
            throw "FAIL";

        if (stores.response.data) {
            // TODO: more error checking here
            storeArray = stores.response.data.map(function(elem) {
                var distance,
                    location = elem.location;

                if (!location || !isNumber(location.latitude) || !isNumber(location.longitude)) {
                    distance = FAR_FAR_AWAY;
                } else {
                    distance = geolib.getDistance(myPos, location) / 1000;
                }

                return createStoreDistanceObject(elem, distance);
            });
        }

        storeArray.sort(function (a, b) {
            return a.distance - b.distance;
        });
        storeArray = filterByOpeninghours(storeArray, filter);
        storeArray = filterByLimits(storeArray, minNumberOfStores, maxNumberOfStores, maxDistance);

        callback(storeArray);
    });
}


exports.getClosestStores = getClosestStores;
exports.setRepository = function(repo) {
    repository = repo;
};