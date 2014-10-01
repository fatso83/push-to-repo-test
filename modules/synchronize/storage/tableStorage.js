var azure = require('azure-storage');
var tableSvc = azure.createTableService('ngts',
    'dxEw64oOI9iGCVuVbTILwEem+4Eq9rBZDsV37UR+B7OvJ3WZZ4jocivJ0QOVpe/ayab5Ek8tzUwQDTk21Qobkw==');

var persistentUserStorageTableName = 'PersistentUserStorage';
var Promise = require("es6-promise").Promise;

module.exports = {

    initialize: function () {
        return new Promise(function (resolve, reject) {
            tableSvc.createTableIfNotExists(persistentUserStorageTableName, function (error, result, response) {
                if (!error) {
                    // Table exists or created
                    console.log('Table ' + persistentUserStorageTableName + ' exists or created');
                    resolve(null);
                } else {
                    console.log('Error when creating table ' + persistentUserStorageTableName);
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

        tableSvc.retrieveEntity(persistentUserStorageTableName, chainId, userId, null, function (error, result, response) {
            if (!error) {
                var data;
                try {
                    data = JSON.parse(result.storage._)
                } catch (error) {
                    callback(error);
                    return;
                }

                callback(null, data);
            } else {
                // result does not contain entity
                callback(null, {});
            }
        });
    },

    /**
     *
     * @param {string} chainId
     * @param {string} userId
     * @param data
     * @param callback
     */
    setUserData: function (chainId, userId, data, callback) {

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
                // Entity updated
                console.log('Entity updated');
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
    removeUserData: function(chainId, userId, callback){

        var entGen = azure.TableUtilities.entityGenerator;
        var userStorage = {
            PartitionKey: entGen.String(chainId),
            RowKey: entGen.String(userId)
        };

        tableSvc.deleteEntity(persistentUserStorageTableName, userStorage, function (error, result, response) {
            if (!error) {
                // Entity updated
                console.log('Entity updated');
                callback(null);
            } else {
                callback(error);
            }
        });
    }
};