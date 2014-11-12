var expect = require('chai').expect;
var  _ = require('lodash');
var storeService = require('../../modules/stores/store_service');

describe('Store service', function () {

    this.timeout(200);

    describe('Find the closest stores', function () {

        var inMemRepository = {
            getStores: function repository(cb) {
                cb(require('./fixtures/kiwistores'));
            }
        };

        beforeEach(function () {
            storeService.setRepository(inMemRepository);
        });

        // test case 1 in #43751-1147
        function testCase1(testCallback) {
            var latitude = 59.9170013, longitude = 10.72788689999993, minNumberOfStores = 1, maxNumberOfStores = 0, maxDistance = 500;

            storeService.getClosestStores(
                latitude, longitude, minNumberOfStores, maxNumberOfStores, maxDistance, null, testCallback
            );
        }

        // test case 2 in #43751-1147
        function testCase2(testCallback) {
            var latitude = 63.4305149, longitude = 10.39505280000003, minnumberofstores = 1, maxNumberOfStores = 0, maxDistance = 1230297, filter = 'isopensunday';

            storeService.getClosestStores(
                latitude, longitude, minnumberofstores, maxNumberOfStores, maxDistance, filter, testCallback
            );
        }

        it('should return an array of stores', function (done) {
            testCase1(function (res) {
                expect(res).to.be.an('array');
                done();
            });
        });

        it('should pass test case 1 of jira case #43751-1147', function (done) {
            testCase1(function (res) {
                var expected = require('./results/43751-1147_testcase1.json'),
                    resultElement = res[0],
                    expectedElement = expected[0];

                expect(res.length).to.equal(expected.length);

                expect(resultElement.store).to.eql(expectedElement.store);
                expect(resultElement.distance).to.be.closeTo(expectedElement.distance, 0.01);

                done();
            });
        });

        it('should pass test case 2 of jira case #43751-1147', function (done) {
            var floorDistanceOfStore = function (store) {
                    var storeWithFlooredDistance = _.extend({}, store);
                    storeWithFlooredDistance.distance = Math.round(storeWithFlooredDistance);
                    return storeWithFlooredDistance;
                },
                productionResults = require('./results/43751-1147_testcase2.json'),
                expected = productionResults.map(floorDistanceOfStore);

            testCase2(function (res) {
                var actual = res.map(floorDistanceOfStore);
                expect(res.length).to.equal(98);
                expect(actual).to.eql(expected);
                done();
            });
        });

        it('should consider incomplete location data as being equal to being really far away', function () {
            var storesWithNullLocation = [
                {
                    "name": "Kiwi 104 Moholt",
                    "location": {
                        "latitude": 0,
                        "longitude": 0

                    }
                },
                {
                    name: "Ny butikk med uferdige data",
                    "location": {
                        "latitude": null,
                        "longitude": null
                    }
                }
            ], repoReturningStoresWithNullInLocation = {
                getStores: function repository(cb) {
                    cb(storesWithNullLocation);
                }
            };

            storeService.setRepository(repoReturningStoresWithNullInLocation);

            var maxDistance = 10;
            var maxNumberOfStores = 10;
            var minNumberOfStores = 1;
            storeService.getClosestStores(
                0, 0, minNumberOfStores, maxNumberOfStores, maxDistance, null, function (res) {
                    expect(res).to.eql([{store: storesWithNullLocation[0], distance: 0}]);
                }
            );


        });

    });

});