/**
 * Service to calculate the closest stores from some point
 */

var geolib = require('geolib');
var moment = require('moment-timezone');

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

// CODE REVIEW PLEASE
function applyTodaysOpeningHours(today, stores) {
    
    stores.map(function (elem) {
        
        if (elem && elem.store && elem.store.openinghours && elem.store.openinghours.today) {
            
            // if cached version is up to date (!), no worries
            if (elem.store.openinghours.today && elem.store.openinghours.today.date == today.format("YYYY-MM-DD"))
                return;
            }

            elem.store.openinghours.today.from = '';
            elem.store.openinghours.today.to = '';

            // if not, overwrite with special openinghours, if any
            if (elem.store.openinghours.special) {
                elem.store.openinghours.special.map(function (special) {
                    if (special.date == today.format("YYYY-MM-DD")) {
                        elem.store.openinghours.today.from = special.from;
                        elem.store.openinghours.today.to = special.to;
                    }
                    return;
                });
            }
            
        // if not, apply ordinary weekday rules
        if (elem.store.openinghours.today.from == '' && elem.store.openinghours.today.to == '') {
            var dayOfWeek = today.format("d");
            var todayWeekdayName = getDayOfWeekConstant(dayOfWeek).toLowerCase();
            var everydayFrom = '';
            var everydayTo = '';

            elem.store.openinghours.days.map(function(day) {
                if (day.label.toLowerCase() == todayWeekdayName) {
                    elem.store.openinghours.today.from = day.from;
                    elem.store.openinghours.today.to = day.to;
                    return;
                }
                if (day.label.toLowerCase() == "hverdager") {
                    everydayFrom = day.from;
                    everydayTo = day.to;
                }
            });

            if (elem.store.openinghours.today.from == '' && elem.store.openinghours.today.to == '' && (parseInt(dayOfWeek) <= 5)) {
                elem.store.openinghours.today.from = everydayFrom;
                elem.store.openinghours.today.to = everydayTo;
            }
        }

    });
}

function getDayOfWeekConstant(dayOfWeek) {
    switch (parseInt(dayOfWeek)) {
    case 1: return "Mandag";
    case 2: return "Tirsdag";
    case 3: return "Onsdag";
    case 4: return "Torsdag";
    case 5: return "Fredag";
    case 6: return "Lørdag";
    case 7: return "Søndag";
    default: return "";
    }
}

// CODE REVIEW PLEASE
function getClosestStores(chainId, latitude, longitude, minNumberOfStores, maxNumberOfStores, maxDistance, filter, callback) {
    var myPos = {"latitude": latitude, "longitude": longitude};
    var FAR_FAR_AWAY = Math.pow(10, 100);

    repository.getStores(chainId, function (stores) {
        
        if (stores.response.code != "200")
            return [];

        var storeArray = [];
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


            storeArray.sort(function(a, b) {
                return a.distance - b.distance;
            });
            storeArray = filterByOpeninghours(storeArray, filter);
            storeArray = filterByLimits(storeArray, minNumberOfStores, maxNumberOfStores, maxDistance);
            
            var today = moment().tz("Europe/Oslo");
            applyTodaysOpeningHours(today, storeArray);
        }

        callback(storeArray);
    });
}


exports.getClosestStores = getClosestStores;
exports.applyTodaysOpeningHours = applyTodaysOpeningHours;

exports.setRepository = function(repo) {
    repository = repo;
};