var log4js = require('log4js'),
    expect = require('expect.js'),
    logger = log4js.getLogger('Synchronize Service'),
    chai = require('chai'),
    assert = chai.assert;

describe('Synchronize table storage', function () {

    var service,
        storage,
        chainId2 = '2',
        userId = 'testUser';

    var mockDataV1 = {
        codeMonkey: true,
        date: new Date()
    };

    before(function (done) {
        storage = require('../../modules/synchronize/storage/tableStorage.js');
        service = require('../../modules/synchronize/service.js');
        service.setStorage(storage);
        done();
    });

    after(function (done) {
        storage.removeUserData(chainId2, userId, function (error, result) {
            assert.isNull(error);
            done();
        });
    });

    it('should update data in table storage', function (done) {

        var clientState = {
            updated: [
                {
                    key: 'fooBar',
                    version: 0,
                    data: mockDataV1
                }
            ]
        };

        service.synchronize(chainId2, userId, clientState, function (error, result) {

            assert.isNull(error, 'Synchronize service failed');
            assert.equal(result.updated.length, 1);
            assert.equal(result.updated[0].key, 'fooBar');
            assert.equal(result.updated[0].version, 1);
            assert.equal(result.updated[0].data, mockDataV1);

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

    it('should remove keys from unchanged when keys are not in table storage', function () {

        var clientState = {
            unchanged: [
                { key: 'fooRemoved', version: 3},
                { key: 'someItemAddedByOtherDevice', version: 34}
            ]
        };
        service.synchronize(chainId2, userId, clientState, function (error, result) {

            assert.isNull(error, 'Synchronize service failed');

            expect(result.updated).to.be.empty();
            expect(result.removedKeys).to.be.eql(['fooRemoved']);
            done();
        });
    });
});