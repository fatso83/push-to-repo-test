var moment = require('moment-timezone');

var daysOfTheWeek = {
    1: "Mandag",
    2: "Tirsdag",
    3: "Onsdag",
    4: "Torsdag",
    5: "Fredag",
    6: "Lørdag",
    7: "Søndag"
};

function getDayOfWeekConstant(dayOfWeek) {
    return daysOfTheWeek[dayOfWeek];
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isValidLocation(location) {
    return location &&
        isNumber(location.latitude) &&
        isNumber(location.longitude) &&
        location.latitude >= 0 &&
        location.longitude >= 0;
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
        if (maxNumberOfStores !== 0 && (+i + 1 - minNumberOfStores) >= maxNumberOfStores) {
            return storeArray.slice(0, i);
        }

    }

    return storeArray;
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

function limitNumberOfSpecialOpeningHoursAhead(storeArray, limit) {
    if (!storeArray || limit === 0) {
        return storeArray;
    }

    var i = storeArray.length;
    while (i--) {
        var elem = storeArray[i];
        var isvalid = elem && elem.store && elem.store.openinghours && elem.store.openinghours && elem.store.openinghours.special || false;

        if (!isvalid) {
            continue;
        }

        elem.store.openinghours.special = elem.store.openinghours.special.slice(0, limit);
    }

    return storeArray;
}

function applyWeekdayRules(today, openinghours) {
    var dayOfWeek = parseInt(today.format("d"), 10);
    var isWeekday = (parseInt(dayOfWeek, 10) <= 5);
    var todayWeekdayName = getDayOfWeekConstant(dayOfWeek).toLowerCase();
    var everydayFrom = '';
    var everydayTo = '';

    openinghours.days.forEach(function (day) {
        if (day.label.toLowerCase() === todayWeekdayName) {
            openinghours.today.from = day.from;
            openinghours.today.to = day.to;
        }
        if (day.label.toLowerCase() === "hverdager") {
            everydayFrom = day.from;
            everydayTo = day.to;
        }
    });

    if (isWeekday && !(openinghours.today.from || openinghours.today.to)) {
        openinghours.today.from = everydayFrom;
        openinghours.today.to = everydayTo;
    }
}
function tryUsingSpecialOpeningHours(openingHours, today) {
    openingHours.special.map(function (special) {
        if (special.date === today.format("YYYY-MM-DD")) {
            openingHours.today.from = special.from;
            openingHours.today.to = special.to;
        }
    });
}

function updateTodaysOpeningHours(openingHours, today) {

    // update date field for today
    openingHours.today.date = today.format("YYYY-MM-DD");

    openingHours.today.from = null;
    openingHours.today.to = null;

    if (openingHours.special) {
        tryUsingSpecialOpeningHours(openingHours, today);
    }

    if (!(openingHours.today.from || openingHours.today.to)) {
        applyWeekdayRules(today, openingHours);
    }
}

function hasTodaysOpeningHoursField(elem) {
    return (elem && elem.store && elem.store.openinghours && elem.store.openinghours.today) || false;
}

/**
 * @param currentDate {Date} the current date
 * @param stores [] stores with distance { store : Object, distance : Number }
 */
function applyTodaysOpeningHours(currentDate, stores) {
    var today = moment(currentDate).tz("Europe/Oslo");

    stores.forEach(function (store) {
        var openingHours;

        if (!hasTodaysOpeningHoursField(store)) {
            return;
        }

        openingHours = store.store.openinghours;

        // update when needed
        if (openingHours.today.date !== today.format("YYYY-MM-DD")) {
            updateTodaysOpeningHours(openingHours, today);
        }
    });
}

module.exports = {
    isNumber: isNumber,
    filterByLimits: filterByLimits,
    filterByOpeninghours: filterByOpeninghours,
    limitNumberOfSpecialOpeningHoursAhead: limitNumberOfSpecialOpeningHoursAhead,
    applyTodaysOpeningHours: applyTodaysOpeningHours,
    isValidLocation: isValidLocation

};