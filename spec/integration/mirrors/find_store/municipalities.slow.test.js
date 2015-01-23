var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');

describe('slow.integration.mirrors.find-store.municipalities service', function () {

    this.timeout(30000);

    var mock = {
        URL: 'http://localhost:1337/api/findstore/municipalities/',
        municipality: null
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

