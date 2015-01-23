var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');

describe('slow.integration.mirrors.vacancies service', function () {

    this.timeout(30000);

    var mock = {
        URL: 'http://localhost:1337/api/data/shoppinglistgroup/1100',
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

        it('should return all shoppingListGroups', function (done) {
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

