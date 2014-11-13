var azure = require('azure-storage'),
    config = require('./table-storage-config.js'),
    service = azure.createTableService(config.tableStorage.account, config.tableStorage.key),
    log4js = require('log4js'),
    logger = log4js.getLogger('Synchronize Service'),
    async = require('async'),
    Transaction = require('./transaction.js'),
    utils = require('../../utils.js');

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
            }, function (callback) {
                var name = config.tableStorage.logTableName;
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

function initialize(callback) {
    createTables(function (error, result) {
        if (!error) {
            logger.trace('The following tables have been created ' + result);
            callback(null);
        } else {
            logger.error('Error when creating tables');
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
    logger.trace('Getting user data from Table Storage: chain: ' + chainId + ' user: ' + userId );

    var query = new azure.TableQuery()
        .select(['RowKey', 'storage'])
        .where('PartitionKey eq ?', userId);

    service.queryEntities(config.chainName(chainId), query, null, function (error, result, response) {
        if (!error) {
            var userData = {};
            var userStorage = result.entries;

            for (var key in userStorage) {
                var entityValue;
                try {
                    entityValue = JSON.parse(userStorage[key].storage._);
                } catch (error) {
                    callback(error);
                    return;
                }
                userData[userStorage[key].RowKey._] = entityValue;
            }
            logger.trace('Finished retrieval from Table Storage');
            callback(null, userData);
        } else {
            logger.error('Error retrieving data from Table Storage');
            callback(error, {});
        }
    });
}

function databaseLog(userId, key, errorMessage, logMessage) {

    var entGen = azure.TableUtilities.entityGenerator;
    var logEntity = {
        PartitionKey: entGen.String(userId),
        RowKey: entGen.String(key),
        errorMessage: entGen.String(errorMessage),
        logMessage: entGen.String(logMessage)
    };

    service.insertOrReplaceEntity(config.tableStorage.name, logEntity, function (error, result, response) {
        if(error){
            logger.error('Error when inserting or replacing data in Table Storage');
        }
    });
}

/**
 * Currently there´s a limit of 1MB on each key/value (row).
 * @param {string} chainId
 * @param {string} userId
 * @param {obj} userStorage
 * @param callback
 */
function setUserData(chainId, userId, userStorage, callback) {
    logger.trace('Setting user data in Table Storage: chain: ' + chainId + ' user: ' + userId );

    var transaction = new Transaction();
    transaction.start(Object.getOwnPropertyNames(userStorage).length);
    transaction.on('completed', function (error) {
        if (!error) {
            logger.trace('Finished inserting or replacing data in Table Storage');
            callback(null);
        } else {
            logger.error('Error when inserting or replacing data in Table Storage');
            databaseLog(userId, error.key, 'Error when retrieving from Table Storage', error);
            callback(error);
            return;
        }
    });

    for (var key in userStorage) {

        var entityData = userStorage[key];
        if (typeof userStorage == 'object')
            entityData = JSON.stringify(entityData);

        var entGen = azure.TableUtilities.entityGenerator;
        var userEntity = {
            PartitionKey: entGen.String(userId),
            RowKey: entGen.String(key),
            storage: entGen.String(entityData)
        };

        service.insertOrReplaceEntity(config.chainName(chainId), userEntity, function (error, result, response) {
            transaction.commit(error);

            if(error){
                databaseLog(userId, key, userStorage, error, 'Error when inserting or replacing entity');
            }
        });
    }
}

function removeUserData(chainId, userId, callback) {
    logger.trace('Removing user data from Table Storage');

    getUserData(chainId, userId, function (error, userStorage) {

        var transaction = new Transaction();
        transaction.start(Object.getOwnPropertyNames(userStorage).length);
        transaction.on('completed', function (error) {
            if (!error) {
                logger.trace('Finished removing data in Table Storage');
                callback(null);
            } else {
                logger.error('Error when removing data in Table Storage');
                callback(error);
                return;
            }
        });

        if (!error) {
            for (var key in userStorage) {

                var entGen = azure.TableUtilities.entityGenerator;
                var userEntity = {
                    PartitionKey: entGen.String(userId),
                    RowKey: entGen.String(key)
                };

                service.deleteEntity(config.chainName(chainId), userEntity, function (error, result, response) {
                    transaction.commit(error);

                    if(error){
                        databaseLog(userId, key, userStorage, error, 'Error when deleting');
                    }
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