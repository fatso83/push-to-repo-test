// Example tests taken from the NGSharingPrototypeServer project


var request = require('request');
var app = require('../../app');
var expect = require('chai').expect;

describe('slow.server tests', function () {
    var testStart;

    // ngt servers are slow
    this.timeout(6000);

    before(function (done) {
        testStart = Date.now();
        app.start({
            port: 1337,
            disable: {'cache-warmup': 1, 'product-module': 1},
            logging: {level: 'WARN'}
        }, done);
    });

    after(function (done) {
        app.stop(done);
        //console.log('Server API Test duration',(Date.now()-testStart));
    });

    // StoresClosestToMe
    var testCase2_43751_1147 = {
        path: "/api/FindStore/StoresClosestToMe/1100/?latitude=63.4305149&longitude=10.39505280000003&minnumberofstores=1&maxNumberOfStores=0&maxDistance=1230297&filter=isopensunday",
        test: function (stores, done) {
            expect(stores).to.be.an('array');
            expect(stores.length).to.equal(4);
            done();
        }
    };

    var testCase3_43751_1147 = {
        path: '/api/FindStore/AllStoresInCounties/1210',
        test: function (counties, done) {

            try {
                expect(counties.length).to.be.equal(21);

                var ostFold = counties.filter(function (c) {
                    return c.county.name.toLocaleUpperCase() === 'ØSTFOLD';
                })[0];
                expect(ostFold.municipalities.length).to.equal(7);

                done();
            } catch (ex) {
                done(ex);
            }
        }
    };

    var testCase4_43751_1147 = {
        path: '/api/FindStore/Stores/1300',
        test: function (stores, done) {
            expect(stores.length).to.be.greaterThan(170).and.lessThan(210);
            done();
        }
    };


    describe('/FindStore/Stores/[chainid]', function () {

        it('should return somewhere near 186 stores for Meny', function(done) {
            request.get('http://localhost:1337' + testCase4_43751_1147.path, function (err, res, body) {
                if (err) {
                    done(err);
                }

                testCase4_43751_1147.test(JSON.parse(body), done);
            });

        });

        it('should return a single store when there is a storeid parameter', function(done) {
            request.get('http://localhost:1337/api/FindStore/Stores/1100?storeId=7080000908660', function (err, res, body) {
                expect(JSON.parse(body).email).to.equal('kiwi.soras@kiwi.no');
                done();
            });
        });

        it('should return 404 when a storeid parameter is specified but none is found', function(done) {
            request.get('http://localhost:1337/api/FindStore/Stores/1100?storeId=-1', function (err, res, body) {
                expect(res.statusCode).to.equal(404);
                done();
            });
        });

    });
    describe('/FindStore/AllStoresInCounties/[chainid]', function () {

        it('should return 20 counties and the right number of municipalities', function (done) {

            request.get('http://localhost:1337' + testCase3_43751_1147.path, function (err, res, body) {
                if (err) {
                    return done(err);
                }

                testCase3_43751_1147.test(JSON.parse(body), done);
            });

        });
    });

    describe('/api/FindStore/StoresClosestToMe/[chainid]', function () {

        it('should return lots of stores', function (done) {

            request.get('http://localhost:1337' + testCase2_43751_1147.path, function (err, res, body) {
                if (err) {
                    return done(err);
                }

                testCase2_43751_1147.test(JSON.parse(body), done);
            });

        });
    });

    describe('/request', function () {

        describe('storesClosestToMe', function () {

            it('should return an array of stores', function (done) {
                var testCase = {
                    "environment": "preprod",
                    "servicename": "storesClosestToMe",
                    "servicepath": testCase2_43751_1147.path,
                    "frameworkVersion": "5.0.0"
                };

                request.post({
                    uri: 'http://localhost:1337/request',
                    json: true,
                    body: testCase
                }, function (err, res, body) {
                    expect(err).to.equal(null);
                    testCase2_43751_1147.test(body.response.data, done);
                });

            });

        });
    });
});
