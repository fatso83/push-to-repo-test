var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');
var testConfig = require('../../integration-test-config');

describe('slow.integration.mirrors.find-store.counties service', function () {

    this.timeout(testConfig.timeout.HALF_MINUTE);

    var mock = {
        URL: testConfig.URL + 'api/findstore/counties/',
        county: null
    };

    before(function (done) {
        app.start({
            port: 1337,
            disable: {
                'cache-warmup': 1,
                'product-module': 1
            },
            logging: {level: 'WARN'}
        }, done);
    });

    after(function (done) {
        app.stop(done);
    });

    describe('/findstore/counties/', function () {

        it('should return all counties in Norway', function (done) {
            var options = {
                url: mock.URL,
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {
                var counties = JSON.parse(body);
                expect(counties).to.be.an('array');
                expect(counties).to.have.length.above(18);
                mock.county = counties[0];
                return done(error);
            });
        });
    });
});

