var azure = require('azure-storage'),
    config = require('../../config.js'),
    service = azure.createTableService(config.tableStorage.account, config.tableStorage.key),
    log4js = require('log4js'),
    logger = log4js.getLogger('Synchronize Service'),
    async = require('async'),
    Transaction = require('./transaction.js'),
    utils = require('../../utils.js')

function createTable(name, callback) {
    service.createTableIfNotExists(name, function (error, result) {
        if (!error) {
            callback(null);
        } else {
            callback(error);
        }
    });
}

function createTables(callback) {
    async.parallel([
            function (callback) {
                var name = config.tableStorage.table.kiwi.name;
                createTable(name, function (error) {
                    if (!error) {
                        callback(null, name)
                    } else {
                        callback(error);
                    }
                })
            }, function (callback) {
                var name = config.tableStorage.table.meny.name;
                createTable(name, function (error) {
                    if (!error) {
                        callback(null, name)
                    } else {
                        callback(error);
                    }
                })
            }, function (callback) {
                var name = config.tableStorage.table.spar.name;
                createTable(name, function (error) {
                    if (!error) {
                        callback(null, name)
                    } else {
                        callback(error);
                    }
                })
            }, function (callback) {
                var name = config.tableStorage.table.trumf.name;
                createTable(name, function (error) {
                    if (!error) {
                        callback(null, name)
                    } else {
                        callback(error);
                    }
                })
            }, function (callback) {
                var name = config.tableStorage.table.dev.name;
                createTable(name, function (error) {
                    if (!error) {
                        callback(null, name)
                    } else {
                        callback(error);
                    }
                })
            }
        ], function (error, results) {
            if (!error) {
                callback(null, results);
            } else {
                callback(error);
            }
        }
    );
}

/**
 *
 * @param {string} id
 * @returns {string}
 */
function chainName(id) {
    switch (id) {
        case config.tableStorage.table.spar.chainId:
            return config.tableStorage.table.spar.name;
            break;
        case config.tableStorage.table.kiwi.chainId:
            return config.tableStorage.table.kiwi.name;
            break;
        case config.tableStorage.table.meny.chainId:
            return config.tableStorage.table.meny.name;
            break;
        case config.tableStorage.table.trumf.chainId:
            return config.tableStorage.table.trumf.name;
            break;
        default:
            return config.tableStorage.table.dev.name;
            break;
    }
}

function initialize(callback) {
    createTables(function (error, result) {
        if (!error) {
            logger.trace('Tables following tables have been created ' + result);
            callback(null);
        } else {
            callback(error);
        }
    });
}

/**
 *
 * @param {string} chainId
 * @param {string} userId
 * @param callback
 */
function getUserData(chainId, userId, callback) {
    logger.trace('Getting user data from Table Storage');

    var query = new azure.TableQuery()
        .select(['RowKey', 'storage'])
        .where('PartitionKey eq ?', userId);

    service.queryEntities(chainName(chainId), query, null, function (error, result, response) {
        if (!error) {
            var userData = {};
            var entries = result.entries;

            for (var i in entries) {
                var entityValue;
                try {
                    entityValue = JSON.parse(entries[i].storage._);
                } catch (error) {
                    callback(error);
                }
                userData[entries[i].RowKey._] = entityValue;
            }
            logger.trace('Done getting user data from Table Storage');
            callback(null, userData);
        } else {
            logger.trace('Done getting user data from Table Storage');
            callback(error, {});
        }
    });
}

/**
 * //TODO: Consider using transaction with service.beginBatch()
 * //TODO: Split with batch with over 100 keys to support > 4MB
 * Current a limit of 1MB on each key/value (row).
 * @param {string} chainId
 * @param {string} userId
 * @param {obj} data
 * @param callback
 */
function setUserData(chainId, userId, data, callback) {
    logger.trace('Setting user data in Table Storage');

    var transaction = new Transaction();
    transaction.start(utils.objectLength(data));
    transaction.on('completed', function (error) {
        if (!error) {
            callback(null);
        } else {
            callback(error);
        }
    });

    for (var i in data) {

        var entityData = data[i];
        if (typeof data == 'object')
            entityData = JSON.stringify(entityData);

        var entGen = azure.TableUtilities.entityGenerator;
        var userEntity = {
            PartitionKey: entGen.String(userId),
            RowKey: entGen.String(i),
            storage: entGen.String(entityData)
        };

        service.insertOrReplaceEntity(chainName(chainId), userEntity, function (error, result, response) {
            transaction.commit(error);
        });
    }
}

function removeUserData(chainId, userId, callback) {
    logger.trace('Removing user data from Table Storage');

    getUserData(chainId, userId, function (error, data) {

        var transaction = new Transaction();
        transaction.start(utils.objectLength(data));
        transaction.on('completed', function (error) {
            if (!error) {
                callback(null);
            } else {
                callback(error);
            }
        });

        if (!error) {
            for (var i in data) {

                var entGen = azure.TableUtilities.entityGenerator;
                var userEntity = {
                    PartitionKey: entGen.String(userId),
                    RowKey: entGen.String(i)
                };

                service.deleteEntity(chainName(chainId), userEntity, function (error, result, response) {
                    transaction.commit(error);
                });
            }
        } else {
            callback(error);
        }
    });
}

module.exports = {
    initialize: initialize,
    getUserData: getUserData,
    setUserData: setUserData,
    removeUserData: removeUserData
};