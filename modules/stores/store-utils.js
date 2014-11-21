﻿function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isValidLocation(location) {
    return location 
        && isNumber(location.latitude)
        && isNumber(location.longitude)
        && location.latitude > 0
        && location.longitude > 0;
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
    if (!storeArray || limit == 0)
        return storeArray;
    
    var i = storeArray.length;
    while (i--) {
        var elem = storeArray[i];
        var isvalid = elem && elem.store && elem.store.openinghours && elem.store.openinghours && elem.store.openinghours.special || false;
        if (!isvalid)
            continue;
        elem.store.openinghours.special = elem.store.openinghours.special.slice(0, limit);
    }
    
    return storeArray;
}

function applyTodaysOpeningHours(today, stores) {
    
    var i = stores.length;
    while (i--) {
        
        var elem = stores[i];
        var hasopeninghours = elem && elem.store && elem.store.openinghours && elem.store.openinghours.today || false;
        if (!hasopeninghours)
            continue;
        
        var openinghours = elem.store.openinghours;
        
        // if cached version is up to date (!), no worries
        if (openinghours.today.date == today.format("YYYY-MM-DD"))
            continue;
        
        openinghours.today.from = '';
        openinghours.today.to = '';
        
        // TODO: splitte ut
        // if not, overwrite with special openinghours, if any
        if (openinghours.special) {
            openinghours.special.map(function (special) {
                if (special.date == today.format("YYYY-MM-DD")) {
                    openinghours.today.from = special.from;
                    openinghours.today.to = special.to;
                }
                return;
            });
        }
        
        // if not, apply ordinary weekday rules
        if (openinghours.today.from == '' && openinghours.today.to == '') {
            var dayOfWeek = today.format("d");
            var todayWeekdayName = getDayOfWeekConstant(dayOfWeek).toLowerCase();
            var everydayFrom = '';
            var everydayTo = '';
            
            openinghours.days.map(function (day) {
                if (day.label.toLowerCase() == todayWeekdayName) {
                    openinghours.today.from = day.from;
                    openinghours.today.to = day.to;
                }
                if (day.label.toLowerCase() == "hverdager") {
                    everydayFrom = day.from;
                    everydayTo = day.to;
                }
            });
            
            if (openinghours.today.from == '' && openinghours.today.to == '' && (parseInt(dayOfWeek, 10) <= 5)) {
                openinghours.today.from = everydayFrom;
                openinghours.today.to = everydayTo;
            }
        }
    }
}

function getDayOfWeekConstant(dayOfWeek) {
    switch (parseInt(dayOfWeek, 10)) { 
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

module.exports = {
    isNumber : isNumber,
    filterByLimits : filterByLimits,
    filterByOpeninghours : filterByOpeninghours,
    limitNumberOfSpecialOpeningHoursAhead : limitNumberOfSpecialOpeningHoursAhead,
    applyTodaysOpeningHours : applyTodaysOpeningHours,
    isValidLocation : isValidLocation

};