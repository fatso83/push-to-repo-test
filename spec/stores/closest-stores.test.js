var expect = require('chai').expect;
var inMemRepository = {
    getStores: function repository(cb) {
        cb(require('./kiwistores'));
    }
};

var storeService = require('../../modules/stores/store_service');
storeService.setRepository(inMemRepository);

describe('Store service', function () {

    this.timeout(200);

    describe.only('Find the closest stores', function () {

        // test case 1 in #43751-1147
        function testCase1(testCallback) {
            var latitude=59.9170013,longitude=10.72788689999993,minNumberOfStores=1,maxNumberOfStores=0,maxDistance=500;

            storeService.getClosestStores(
                latitude, longitude, minNumberOfStores, maxNumberOfStores, maxDistance, filter, testCallback
            );
        }

        // test case 2 in #43751-1147
        function testCase2(testCallback) {
            var latitude = 63.4305149, longitude = 10.39505280000003, minnumberofstores = 1, maxNumberOfStores = 0, maxDistance = 1230297, filter = 'isopensunday';

            storeService.getClosestStores(
                latitude, longitude, minnumberofstores, maxNumberOfStores, maxDistance, filter, testCallback
            );
        }

        it('should return an array of stores', function(done) {
            testCase2(function(res) {
                expect(res).to.be.an('array');
                done();
            });
        });

        it('should pass test case 1 of jira case #43751-1147', function(done) {
            testCase2(function(res) {
                var firstStore = res[0].store;
                expect(firstStore.name).to.equal("Kiwi 356 Parkveien");
                expect(firstStore.openinghours.days).to.eql([{"to": "23:00","from": "07:00","label": "Hverdager"},{"to": "23:00","from": "09:00","label": "Lørdag"}]);
                expect(res.length).to.equal(40);
                done();
            });
        });

        it('should pass test case 2 of jira case #43751-1147', function(done) {
            testCase2(function(res) {
                expect(res[0].store.name).to.equal("Kiwi 127 Sandnessjøen");
                expect(res.length).to.equal(98);
                done();
            });
        });

    });

});