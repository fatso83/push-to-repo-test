var expect = require('chai').expect;
var request = require('request');
var app = require('../../../app');
var utils = require('../../../modules/utils');
var testConfig = require('../integration-test-config');

describe('slow.integration.mirrors.brandmatch service', function () {

    this.timeout(testConfig.timeout.HALF_MINUTE);

    var mock = {
        URL: testConfig.URL + 'api/admin/'
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

    describe('/admin/redis/status', function () {
        it('should return redis status', function (done) {

            var options = {
                url: mock.URL + 'status/redis',
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {

                var status = JSON.parse(body);

                expect(status).to.be.an('object');
                expect(status).to.include.keys([
                    "address", "connected", "commandQueueLength", "offlineQueueLength", "serverInfo"
                ]);
                expect(status.serverInfo).to.have.deep.property("role", "master");
                return done(error);
            });
        });
    });
});