var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');

describe('slow.integration.mirrors.recommendations service', function () {

    this.timeout(30000);

    var mock = {
        URL: 'http://localhost:1337/api/uidata/recommendations/1100',
        recommendation: null
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

    describe('/uidata/recommendations/', function () {

        it('should return all recommendations', function (done) {
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
                        'title', 'title','type']
                );

                mock.recommendation = recommendations[0];

                done();
            });
        });
    });
});