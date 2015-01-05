var expect = require('chai').expect;
var request = require('request');
var app = require('../../../app');

describe('slow.brandmatch service', function () {

    this.timeout(6000);

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

    describe('/data/brandmatch/', function () {
        it('should return all brandmatches for chainId 1100', function (done) {
            request.post('http://localhost:1337/api/data/brandmatch/1100', function (error, res, body) {

                var brandMatches = JSON.parse(body);

                return done(error);
            });
        });
    });
});