var azure = require('azure-storage'),
    config = require('../../config.js'),
    tableSvc = azure.createTableService(config.tableStorage.account, config.tableStorage.key),
    Promise = require("es6-promise").Promise,
    log4js = require('log4js'),
    logger = log4js.getLogger('Synchronize Service'),
persistentUserStorageTableName = 'PersistentUserStorage';

module.exports = {

    initialize: function () {
        return new Promise(function (resolve, reject) {
            tableSvc.createTableIfNotExists(persistentUserStorageTableName, function (error, result, response) {
                if (!error) {
                    // Table exists or created
                    logger.info('Table ' + persistentUserStorageTableName + ' exists or created');
                    resolve(null);
                } else {
                    logger.error('Error when creating table ' + persistentUserStorageTableName);
                    reject(error);
                }
            });
        });
    },

    /**
     *
     * @param {string} chainId
     * @param {string} userId
     * @param callback
     */
    getUserData: function (chainId, userId, callback) {

        logger.trace('Getting user data from Table Storage');

        tableSvc.retrieveEntity(persistentUserStorageTableName, chainId, userId, null, function (error, result, response) {
            if (!error) {
                var data;
                try {
                    data = JSON.parse(result.storage._)
                } catch (error) {
                    callback(error);
                    return;
                }

                logger.trace('Done getting user data from Table Storage');
                callback(null, data);
            } else {
                // result does not contain entity
                logger.trace('Done getting user data from Table Storage');
                callback(null, {});
            }
        });
    },

    /**
     *
     * @param {string} chainId
     * @param {string} userId
     * @param {obj} data
     * @param callback
     */
    setUserData: function (chainId, userId, data, callback) {

        logger.trace('Setting user data in Table Storage');

        if (typeof data == 'object')
            data = JSON.stringify(data);

        var entGen = azure.TableUtilities.entityGenerator;
        var userStorage = {
            PartitionKey: entGen.String(chainId),
            RowKey: entGen.String(userId),
            storage: entGen.String(data)
        };

        tableSvc.insertOrReplaceEntity(persistentUserStorageTableName, userStorage, function (error, result, response) {

            if (!error) {
                logger.trace('Done setting user data in Table Storage');
                callback(null);
            } else {
                callback(error);
            }
        });
    },

    /**
     *
     * @param {string} chainId
     * @param {string} userId
     * @param callback
     */
    removeUserData: function (chainId, userId, callback) {

        logger.trace('Removing user data from Table Storage');

        var userStorage = {
            PartitionKey: {'_': chainId},
            RowKey: {'_': userId}
        };

        tableSvc.deleteEntity(persistentUserStorageTableName, userStorage, function (error, result, response) {
            if (!error) {
                logger.trace('Done removing user data from Table Storage');
                callback(null);
            } else {
                callback(error);
            }
        });
    }
};