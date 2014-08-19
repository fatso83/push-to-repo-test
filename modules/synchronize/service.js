var log4js = require('log4js'),
	logger = log4js.getLogger('Synchronize Service'),
	loggable = require('./loggable')(logger),
	storage = require('./storage/InMemStorage'),
	userDb;

logger.setLevel(log4js.levels.TRACE);

module.exports = {

	synchronize : function (chainId, userId, clientData, callback) {
		logger.info('Synchronizing data');

		storage.getUserData(chainId, userId, function(err, serverData) {
			var result;

			userDb = serverData;
			try {
				result = synchronize(clientData);
			} catch(error) {
				callback(error);
				return;
			}

			storage.setUserData(chainId, userId, userDb, function(err) {
				if(err) callback(err);

				callback(null, result);
			});
		});
	},

	/** DI/testing purposes */
	setStorage : function (storageImpl) {
		storage = storageImpl;
	}

};

/**
 * Receive changes from the client
 *
 * @param updateObject.removedKeys string[] keys the client asks that we stop syncing
 * @param updateObject.unchanged Object[] array of keys being synced on the form { key, version }
 * @param updateObject.updated Object[] an array of new/updated objects with fields key,version,data
 *
 * This method batches updates on the client and server, meaning we can have partial success:
 * - some fields can have a successful update, whereas other fields can create sync conflicts
 *
 * The return object has the following semantics:
 * - new objects on the server are present both in 'addedKeys' and 'updated'
 * - updated items (that have been synced earlier) are only present in 'updated'
 * - removed items are only in 'removedKeys'
 * - conflicting item updates only end up in 'conflicts', not in 'updates'
 *
 * Refer to the tests for full behavioral documentation.
 *
 * Note to maintainer:
 * -------------------
 * This method is somewhat complex, mostly due to the domain of synchronization which involves a lot of
 * interdependencies with the data. Order of operations matter here, so ensure the tests run after
 * doing any changes.
 *
 * @returns {Object} with fields addedKeys, removedKeys, updated, conflicts
 */
var synchronize = loggable(function synchronize (data) {
	var updateObject = ensureValidData(data),
		newItemsOnClient,
		newKeysOnServer,
		updatedItemsOnServer,
		conflictingKeys,
		unConflictingKeys,
		toBeUpdatedKeys,
		updatedOnClient,
		unchangedKeysOnClient,
		unchangedOnClient,
		itemsAddedToServer,
		updatesFromClientWithNewVersion,
		clientKeys;


	function isConflicting (key) {
		return conflictingChange(findInListWithKey(key, updatedOnClient));
	}

	// set variables
	updatedOnClient = updateObject.updated;
	unchangedOnClient = updateObject.unchanged;
	newItemsOnClient = updatedOnClient.filter(function (obj) {
		return !obj.hasOwnProperty('version') || !obj.version;
	});

	unchangedKeysOnClient = unchangedOnClient.map(key);
	clientKeys = unchangedKeysOnClient.concat(updatedOnClient.map(key));

	removeKeysFromDB(updateObject.removedKeys);

	updatedItemsOnServer = getUpdatedItemsOnServer(toVersionMap(updatedOnClient, unchangedOnClient));

	newKeysOnServer = getKeysAddedSinceLastSync(updatedItemsOnServer, clientKeys);

	// ignore updates to entries that have been removed from syncing
	toBeUpdatedKeys = updatedOnClient.map(key).filter(isInDB);

	unConflictingKeys = toBeUpdatedKeys.filter(not(isConflicting));
	conflictingKeys = toBeUpdatedKeys.filter(isConflicting);

	itemsAddedToServer = addEntriesToDB(newItemsOnClient);
	updatesFromClientWithNewVersion = updateDatabase(unConflictingKeys, updatedOnClient);

	if (logger.isTraceEnabled()) {logger.trace(getDatabaseAsString());}

	return {
		removedKeys : getKeysRemovedFromServer(clientKeys),
		addedKeys   : newKeysOnServer,
		updated     : createUpdatedItems(conflictingKeys, updatedItemsOnServer, itemsAddedToServer, updatesFromClientWithNewVersion),
		conflicts   : getConflicts(conflictingKeys, updatedOnClient)
	}
});


function isIn (list) {
	return function (val) {
		return contains(list, val);
	}
}

// negate predicate function by currying
function not (predicate) {
	return function () {
		return !predicate.apply(null, arguments);
	};
}


function or (fn1, fn2) {
	return function () {
		var res1 = fn1.apply(null, arguments);
		if (res1 === true) {
			return true;
		}
		else {
			return  fn2.apply(null, arguments);
		}
	}
}

var getFromDB = function (key) { return userDb[key] };

function contains (list, val) { return list.indexOf(val) !== -1; }

function key (obj) { return obj.key; }

var isInDB = function (key) { return userDb.hasOwnProperty(key) };
var isNotInDB = not(isInDB);

function assert (cond, msg) { if (!cond) throw new Error('Assertion failed: ' + msg); }

/**
 * A conflicting change is an update where
 * - The corresponding item in the db has a version number that is greater than the updated item on the client
 *
 * @param obj
 * @returns {boolean}
 */
var conflictingChange = loggable(function conflictingChange (obj) {

	// Sanity check
	// If a change with a version number has no correspondance in the db,
	// it has been removed and should not be applied.
	if (!isInDB(obj.key)) {
		assert(!obj.hasOwnProperty('version'), 'Only non-removed entries need checking');

		return false;
	}

	return (obj.version !== userDb[obj.key].version)
});


var createConflictObject = function (obj) {
	return {
		key           : obj.key,
		clientVersion : obj.version || null,
		serverVersion : userDb[obj.key].version,
		latest        : userDb[obj.key].data
	};
};


var getKeysRemovedFromServer = loggable(function getKeysRemovedFromServer (keysFromClient) {
	return  keysFromClient.filter(isNotInDB);
});

/**
 * @param updatedItemsOnServer Object[] a list of the updated items on server
 * @param keysToSyncFromClient String[] a list of the keys
 * @returns String[] of keys
 */
var getKeysAddedSinceLastSync = loggable(function getKeysAddedSinceLastSync (updatedItemsOnServer, keysToSyncFromClient) {
	var containedInClientKeys = function (obj) { return contains(keysToSyncFromClient, obj.key)};

	return updatedItemsOnServer.filter(not(containedInClientKeys)).map(key);
});

/**
 * @param versionMap {Object} a key:version map of all the keys the client currently subscribes to
 * @returns All updated items from the database, including new ones
 */
var getUpdatedItemsOnServer = loggable(function getUpdatedItemsOnServer (versionMap) {
	var notOnClient = loggable(function notOnClient (dbKey) { return !versionMap.hasOwnProperty(dbKey) });
	var notSameVersion = loggable(function notSameVersion (dbKey) { return versionMap[dbKey] !== userDb[dbKey].version });

	return Object.keys(userDb)
		.filter(or(notOnClient, notSameVersion))
		.map(getFromDB);
});


/** Adds an entry for the keys - if they are not already in the database */
var addEntriesToDB = loggable(function addEntriesToDB (newItems) {
	var added = [];
	newItems.forEach(function (item) {

		if (isInDB(item.key)) { return; }

		userDb[item.key] = { version : 1, key : item.key, data : item.data};
		added.push(userDb[item.key]);
	});
	return added;
}, { args : true});


var removeKeysFromDB = loggable(function removeKeysFromDB (removedKeysOnClient) {
	removedKeysOnClient.forEach(function (key) { delete userDb[key];})
}, { args : true });


var updateDatabase = loggable(function updateDatabase (unConflictingKeys, updatedOnClient) {
	var updatesFromClientWithNewVersion = [];
	unConflictingKeys.forEach(function (keyToUpdate) {
		var update = getObject(keyToUpdate, updatedOnClient);
		userDb[update.key] = update;
		userDb[update.key].version++;
		updatesFromClientWithNewVersion.push(userDb[update.key]);
	});
	return updatesFromClientWithNewVersion;
});

function getObject(key, listOfUpdates) {
	return listOfUpdates.filter( function( o) { return o.key === key; })[0];
}

// For debug/logging purposes
function getDatabaseAsString () {
	return 'DB: ' + '\n' + JSON.stringify(userDb, null, '\t');
}

/**
 * Assert that the keys don't overlap
 * @param [updateObject] is allowed to be falsy
 * @returns {Object} a valid update object
 */
function ensureValidData (updateObject) {
	var tmp = updateObject || {},
		updated = tmp.updated || [],
		unchanged = tmp.unchanged || [],
		removedKeys = tmp.removedKeys || [],
		updatedKeys = (updated || []).map(key),
		unchangedKeys = (unchanged || []).map(key),
		validData = { updated : updated, unchanged : unchanged, removedKeys : removedKeys},
		allKeys = updatedKeys.concat(unchangedKeys).concat(removedKeys);

	for (var i = 0, arr = allKeys.sort(), prev = {}; i < arr.length; i++) {
		var current = arr[i];
		assert(current !== prev, 'Overlapping keys in the fields in the update object: ' + current);
		prev = current;
	}

	return  validData;
}

var getConflicts = loggable(function getConflicts (conflictingKeys, updatedOnClient) {
	return conflictingKeys
		.map(itemFromList(updatedOnClient))
		.map(createConflictObject);
});

/** @returns function(key) that finds an item with key in list */
function itemFromList (list) {
	return function (key) { return findInListWithKey(key, list)};
}

function findInListWithKey (theKey, list) {
	var idx = list.map(key).indexOf(theKey);
	if (idx === -1) throw Error('Should have found a value');
	return list[idx];
}

function toVersionMap (varargs_Arrays) {
	var map = {};

	for (var i = 0; i < arguments.length; i++) {
		var arr = arguments[i];

		arr.forEach(function (obj) {
			map[obj.key] = obj.version;
		});
	}

	return map;
}


var createUpdatedItems = loggable(function createUpdatedItems (conflictingKeys, updatedItemsOnServer, itemsAddedToServer, updatesFromClientWithNewVersion) {
	return updatedItemsOnServer
		.map(key)
		.filter(not(isIn(conflictingKeys)))
		.map(itemFromList(updatedItemsOnServer))
		.concat(updatesFromClientWithNewVersion)
		.concat(itemsAddedToServer)
});
