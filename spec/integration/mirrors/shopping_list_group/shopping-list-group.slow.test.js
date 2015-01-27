var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');
var testConfig = require('../../integration-test-config');

describe('slow.integration.mirrors.vacancies service', function () {

    this.timeout(testConfig.timeout.HALF_MINUTE);

    var mock = {
        URL: testConfig.URL + 'api/data/shoppinglistgroup/' + testConfig.chainId,
        shoppingListGroupItem: null
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

    describe('/data/shoppinglistgroup/', function () {

        it('should return all shoppingListGroups for chain ' + testConfig.chainId, function (done) {
            var options = {
                url: mock.URL,
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {

                var shoppingListGroups = JSON.parse(body);

                expect(shoppingListGroups).to.be.an('array');
                expect(shoppingListGroups).to.have.length.above(10);

                mock.shoppingListGroupItem = shoppingListGroups[0];

                done();
            });
        });

    });
});

