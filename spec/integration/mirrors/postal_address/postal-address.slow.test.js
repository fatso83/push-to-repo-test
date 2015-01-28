var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');
var testConfig = require('../../integration-test-config');

describe('slow.integration.mirrors.postal-address service', function () {

    this.timeout(testConfig.timeout.HALF_MINUTE);

    var mock = {
        URL: testConfig.URL + 'api/data/postaladdress',
        postalCode: "0164",
        place: 'Oslo'
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

    describe('/data/postaladdress/', function () {

        it('should return name for postal address ' + mock.postalCode, function (done) {
            var options = {
                url: mock.URL + '?postalcode=' + mock.postalCode,
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {
                var postalAddress = JSON.parse(body);
                expect(postalAddress).to.be.an('object');
                expect(postalAddress.code).to.equal(mock.postalCode);
                expect(postalAddress.place).to.equal(mock.place.toUpperCase());

                return done(error);
            });
        });
    });
});

