var expect = require('chai').expect;
var _ = require('lodash');
var storeService = require('../../modules/stores/store_service');


describe('Store service', function () {
    var DELTA_IN_PERCENT = 0.5;

    this.timeout(200);

    describe('Find the closest stores', function () {
        
        

        var inMemRepository = {
            getStores: 
                function repository(chainId, cb) {
                    cb(null, require('./fixtures/kiwistores'));
                }
        };

        beforeEach(function () {
            storeService.setRepository(inMemRepository);
        });

        function testCase(chainId, lat, lon, maxdistance, filter, testCaseFileName, callback) {

            storeService.getClosestStores(chainId, lat, lon, 1, 0, maxdistance, filter, function (err, actualResults) {
                if(err) { return callback(err); }

                var expectedResults = require(testCaseFileName);

                for (var i = 0, actual, expected; i < actualResults.length; i++) {
                    
                    actual = actualResults[i];
                    expected = expectedResults[i];
                    
                    expect(actual.store).to.eql(expected.store);
                    expect(actual.distance / expected.distance * 100).to.be.closeTo(100, DELTA_IN_PERCENT);
                }

                callback();
            });
        }

        it('should pass test case 1 of jira case #43751-1147', function (done) {
            testCase(1100, 59.9170013, 10.72788689999993, 500, null, './expected/43751-1147_testcase1.json', done);
        });

        it('should pass test case 2 of jira case #43751-1147', function (done) {
            testCase(1100, 63.4305149, 10.39505280000003, 1230297, 'isopensunday', './expected/43751-1147_testcase2.json', done);
        });

        it('should ignore stores with invalid location data', function () {
            var storesWithNullLocation = [
                        {
                            
                            "name": "Kiwi 104 Moholt",
                            "location": {
                                "latitude": 0,
                                "longitude": 0

                            }
                        },
                        {
                            "name": "Ny butikk med uferdige data",
                            "location": {
                                "latitude": null,
                                "longitude": null
                            }
                        }
                    ];

            var repoReturningStoresWithNullInLocation = {
                getStores: function repository(chainId, cb) {
                    cb(null, storesWithNullLocation);
                }
            };

            storeService.setRepository(repoReturningStoresWithNullInLocation);

            var maxDistance = 10;
            var maxNumberOfStores = 10;
            var minNumberOfStores = 1;
            var chainId = 1100;
            storeService.getClosestStores(
                chainId, 0, 0, minNumberOfStores, maxNumberOfStores, maxDistance, null, function (err , res) {
                    expect(res).to.eql([{store: storesWithNullLocation[0], distance: 0}]);
                }
            );

        });

    });

});