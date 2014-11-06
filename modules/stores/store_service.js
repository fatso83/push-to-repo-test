/**
 * Service to calculate the closest stores from some point
 */

var geolib = require('geolib');
var repository = require('./data/kiwistores');

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
            //console.log(+i + " + 1 - " + minNumberOfStores + " = ");
            //console.log(+i + 1 - minNumberOfStores);
            return storeArray.slice(0, i);
        }

    }
    return storeArray;
}

function createStoreDistanceObject(storeObject, distance) {
    var distanceStore = {
        "distance": distance,
        "store": storeObject
    };
    return distanceStore;
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


function getClosestStores(latitude, longitude, minNumberOfStores, maxNumberOfStores, maxDistance, filter) {
    var myPos = {"latitude": latitude, "longitude": longitude};

    var storeArray = repository.map(function (elem) {
        return createStoreDistanceObject(elem, geolib.getDistance(myPos, elem.location) / 1000);
    });

    storeArray.sort(function (a, b) {
        return a.distance - b.distance;
    });
    storeArray = filterByOpeninghours(storeArray, filter);
    storeArray = filterByLimits(storeArray, minNumberOfStores, maxNumberOfStores, maxDistance);
    return storeArray;

}

exports.getClosestStores = getClosestStores;