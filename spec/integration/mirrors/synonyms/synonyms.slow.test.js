var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');
var testConfig = require('../../integration-test-config');

describe('slow.integration.mirrors.synonyms service', function () {

    this.timeout(testConfig.timeout.HALF_MINUTE);

    var mock = {
        URL: testConfig.URL + 'api/data/synonyms/' + testConfig.chainId,
        synonym: null
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

    describe('/data/synonyms/', function () {

        it('should return all synonyms', function (done) {
            var options = {
                url: mock.URL,
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {

                var synonyms = JSON.parse(body);

                expect(synonyms).to.be.an('array');
                expect(synonyms).to.have.length.above(10);
                expect(synonyms[0]).to.include.keys([
                        'title', 'shoppinglistgroupid']
                );

                mock.synonym = synonyms[0];

                done();
            });
        });

    });
});

