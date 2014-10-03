var utils = require('./utils.js')

var tableStorage = {
    account: 'ngts',
    key: 'dxEw64oOI9iGCVuVbTILwEem+4Eq9rBZDsV37UR+B7OvJ3WZZ4jocivJ0QOVpe/ayab5Ek8tzUwQDTk21Qobkw==',
    table: {
        trumf: {
            name: 'UserStorageTrumf',
            chainId: '113'
        },
        spar: {
            name: 'UserStorageSpar',
            chainId: '1210'
        },
        kiwi: {
            name: 'UserStorageKiwi',
            chainId: '1100'
        },
        meny: {
            name: 'UserStorageMeny',
            chainId: '1300'
        },
        dev: {
            name: 'UserStorageDev',
            chainId: 'any'
        }
    }
};

module.exports = {
    tableStorage: tableStorage,
    /**
     *
     * @param {string} id
     * @returns {string}
     */
    chainName: function chainName(id) {

        for(var i in tableStorage.table){
            if(tableStorage.table[i].chainId === id)
                return tableStorage.table[i].name;
        }

        return tableStorage.table.dev.name;
    }
};