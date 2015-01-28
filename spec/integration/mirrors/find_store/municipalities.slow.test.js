var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');
var testConfig = require('../../integration-test-config');

describe('slow.integration.mirrors.find-store.municipalities service', function () {

    this.timeout(testConfig.timeout.HALF_MINUTE);

    var mock = {
        URL: testConfig.URL + 'api/findstore/municipalities/',
        municipality: null
    };

    before(function (done) {
        if(testConfig.isLocal()){
            return app.start(testConfig.appOverrides, done);
        }
        done();
    });

    after(function (done) {
        if(testConfig.isLocal()){
            return app.stop(done);
        }
        done();
    });

    describe('/findstore/municipalities/', function () {

        it('should return all municipalities in Norway', function (done) {
            var options = {
                url: mock.URL,
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {
                var municipalities = JSON.parse(body);
                expect(municipalities).to.be.an('array');
                expect(municipalities).to.have.length.above(427);
                mock.municipality = municipalities[0];
                return done(error);
            });
        });
    });
});

