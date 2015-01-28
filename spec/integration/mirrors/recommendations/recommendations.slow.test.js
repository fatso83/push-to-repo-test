var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');
var testConfig = require('../../integration-test-config');

describe('slow.integration.mirrors.recommendations service', function () {

    this.timeout(testConfig.timeout.HALF_MINUTE);

    var mock = {
        URL: testConfig.URL + 'api/uidata/recommendations/' + testConfig.chainId,
        recommendation: null
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

    describe('/uidata/recommendations/', function () {

        it('should return all recommendations in chain ' + testConfig.chainId, function (done) {
            var options = {
                url: mock.URL,
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {

                var recommendations = JSON.parse(body);
                expect(recommendations).to.be.an('array');
                expect(recommendations).to.have.length.above(40);
                expect(recommendations[0]).to.include.keys([
                        'category', 'detailstype', 'freetext', 'icons', 'id',
                        'imageid', 'price', 'promotiontags', 'showicons', 'subtitle',
                        'title', 'title', 'type']
                );

                mock.recommendation = recommendations[0];

                done();
            });
        });
    });
});