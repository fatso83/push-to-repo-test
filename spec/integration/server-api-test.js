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

    describe('storesClosestToMe', function () {

        it('should return an array of stores', function (done) {
            var testCase = {
                "environment": "preprod",
                "servicename": "storesClosestToMe",
                "servicepath": "api/FindStore/StoresClosestToMe/1100/?latitude=63.4305149&longitude=10.39505280000003&minnumberofstores=1&maxNumberOfStores=0&maxDistance=1230297&filter=isopensunday",
                "frameworkVersion": "5.0.0"
            };

            request.post({
                uri: 'http://localhost:1337/request',
                json: true,
                body : testCase
            }, function (err, res, body) {
                expect(err).to.equal(null);

                var stores = body.response.data;
                expect(stores).to.be.an('array');

                done();
            });

        });

    });
});
