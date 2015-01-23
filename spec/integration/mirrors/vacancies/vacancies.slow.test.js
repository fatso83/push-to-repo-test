var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');

describe('slow.integration.mirrors.shopping-list-group service', function () {

    this.timeout(30000);

    var mock = {
        URL: 'http://localhost:1337/api/data/vacancies/1100',
        vacancyId: null
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

    describe('/data/vacancies/', function () {

        it('should return all vacancies for chainId 1100', function (done) {
            var options = {
                url: mock.URL,
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {
                var vacancies = JSON.parse(body);
                expect(vacancies).to.be.an('array');
                expect(vacancies).to.have.length.above(5);
                mock.vacancyId = vacancies[0].vacancyId;
                return done(error);
            });
        });

        // If this test fails please also check assumptions in the mock.
        it('should return a vacancy item with id ' + mock.vacancyId + ' assuming a vacancy with such an id exists', function (done) {
            var options = {
                url: mock.URL + '?vacancyid=' + mock.vacancyId,
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {
                var vacancyItem = JSON.parse(body);
                expect(vacancyItem).to.be.an('object');
                expect(vacancyItem).to.include.keys([
                    'applicationurl', 'commence', 'companyname', 'contactpersonname'
                ]);
                expect(vacancyItem).to.have.deep.property('companyname', 'KIWI');
                return done(error);
            });
        });
    });
});

