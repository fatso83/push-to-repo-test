// Example tests taken from the NGSharingPrototypeServer project


var request = require('request');
var app = require('../../app');
var expect = require('chai').expect;

describe('slow.server tests', function () {

    before(function (done) {
        process.env.PORT = 1337;
        app.start(done);
    });

    after(function (done) {
        app.stop(done);
    });

    // StoresClosestToMe
    var testCase2_43751_1147 = {
        path: "/FindStore/StoresClosestToMe/1100/?latitude=63.4305149&longitude=10.39505280000003&minnumberofstores=1&maxNumberOfStores=0&maxDistance=1230297&filter=isopensunday",
        test: function testCase2_43751_1147(stores, done) {
            expect(stores).to.be.an('array');
            expect(stores.length).to.be.greaterThan(90).and.lessThan(200);
            done();
        }
    };

    describe('/FindStore/Stores/[chainid]', function () {
    });
    describe('/FindStore/AllStoresInCounties/[chainid]', function () {
    });

    describe.only('/FindStore/StoresClosestToMe/[chainid]', function () {

        it('should return lots of stores', function (done) {

            request.get('http://localhost:1337' + testCase2_43751_1147.path, function (err, res, body) {
                if(err) { done(err); }

                testCase2_43751_1147.test(JSON.parse(body),done);
            });

        });
    });

    describe('/request', function () {

        describe('storesClosestToMe', function () {

            it('should return an array of stores', function (done) {
                var testCase = {
                    "environment": "preprod",
                    "servicename": "storesClosestToMe",
                    "servicepath": "api" + testCase2_43751_1147.path,
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
