var log4js = require('log4js'),
    expect = require('expect.js'),
    logger = log4js.getLogger('Synchronize Service'),
    chai = require('chai'),
    assert = chai.assert;

describe('slow.synchronize table storage', function () {

    this.timeout(10000);

    var service,
        storage,
        chainId2 = 'dev',
        userId = 'testUser';

    var mockDataV1 = {
        codeMonkey: true
    };

    var mockDataV2 = {
        codeMonkey: true,
        activity: 'eating'
    };

    var mockDataV3 = {
        codeMonkey: false,
        activity: 'sleeping'
    };

    before(function (done) {
        storage = require('../../../modules/synchronize/storage/tableStorage_v2.js');
        service = require('../../../modules/synchronize/service.js');
        service.setStorage(storage);

        logger.setLevel(log4js.levels.OFF);
        storage.initialize(done);
    });

    after(function(done){
        storage.removeUserData(chainId2, userId, done);
    });

    it('should update data in table storage', function (done) {

        var clientState = {
            updated: [
                {
                    key: 'fooBar',
                    data: mockDataV1
                },
                {
                    key: 'mockMe',
                    data: mockDataV1
                }
            ]
        };

        service.synchronize(chainId2, userId, clientState, function (error, result) {
            error && done(error);

            assert.equal(result.updated.length, 2);
            assert.equal(result.updated[0].key, 'fooBar');
            assert.equal(result.updated[0].version, 1);
            assert.equal(result.updated[0].data, mockDataV1);

            expect(result.removedKeys).to.be.empty();
            expect(result.conflicts).to.be.empty();

            done();
        });
    });

    it('should update existing data in table storage', function (done) {

        var clientState = {
            updated: [
                {
                    key: 'fooBar',
                    version: 1,
                    data: mockDataV2
                },{
                    key: 'mockMe',
                    version: 1,
                    data: mockDataV2
                }

            ]
        };

        service.synchronize(chainId2, userId, clientState, function (error, result) {

            if(error) done(error);

            assert.equal(result.updated.length, 2);
            assert.equal(result.updated[0].key, 'fooBar');
            assert.equal(result.updated[0].version, 2);
            assert.equal(result.updated[0].data, mockDataV2);

            expect(result.removedKeys).to.be.empty();
            expect(result.conflicts).to.be.empty();

            done();
        });
    });

    it('should not return updated items when having latest version', function (done) {

        var clientState = {
            updated: [
                {
                    key: 'fooBar',
                    version: 0,
                    data: mockDataV1
                },{
                    key: 'mockMe',
                    version: 0,
                    data: mockDataV1
                }
            ]
        };

        service.synchronize(chainId2, userId, clientState, function (error, result) {

            assert.isNull(error, 'Synchronize service failed');

            expect(result.addedKeys).to.be.empty();
            expect(result.updated).to.be.empty();

            done();
        });
    });

    it('should remove keys from unchanged when keys are not in table storage', function (done) {

        var clientState = {
            unchanged: [
                {
                    key: 'fooRemoved',
                    version: 3
                },
                {
                    key: 'someItemAddedByOtherDevice',
                    version: 34
                }
            ]
        };
        service.synchronize(chainId2, userId, clientState, function (error, result) {
            if(error) done(error)

            assert.equal(result.removedKeys.length, 2);
            done();
        });
    });

    it('should return a conflict', function (done) {
        var clientState = {
            updated: [
                {
                    key: 'fooBar',
                    version: 1,
                    data: mockDataV3
                },{
                    key: 'mockMe',
                    version: 1,
                    data: mockDataV3
                }
            ]
        };

        service.synchronize(chainId2, userId, clientState, function (error, result) {

            assert.isNull(error, 'Synchronize service failed');

            assert.equal(result.updated.length, 0);
            assert.equal(result.removedKeys.length, 0);
            assert.equal(result.conflicts.length, 2);

            done();
        });
    });
});