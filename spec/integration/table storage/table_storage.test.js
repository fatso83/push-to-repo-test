var log4js = require('log4js'),
    logger = log4js.getLogger('Synchronize Service'),
    chai = require('chai'),
    assert = chai.assert;

describe('Table storage', function () {

    var service,
        storage,
        chainId1 = '1',
        userId = 'testUser2';

    var mockData = {
        init: {
            key:'init',
            version: 5,
            data: {
                codeMonkey: true,
                date: new Date()
            }
        }
    };

    before(function (done) {
        storage = require('../../../modules/synchronize/storage/tableStorage_v1.js');
        service = require('../../../modules/synchronize/service.js');
        service.setStorage(storage);
        done();
    });

    after(function(done){
        storage.removeUserData(chainId1, userId, function (error, result) {
            assert.isNull(error);
            done();
        });
    });

    it('should create table for synchronize', function (done) {
        storage.initialize().then(function (error) {
            assert.isNull(error);
            done();
        });
    });

    it('should insert or replace user data into azure table storage', function (done) {
        storage.setUserData(chainId1, userId, mockData, function (error) {
            assert.isNull(error);
            done();
        });
    });

    it('should retrieve user data from azure table storage', function (done) {
        storage.getUserData(chainId1, userId, function (error, result) {
            assert.isNull(error);
            done();
        });
    });
});