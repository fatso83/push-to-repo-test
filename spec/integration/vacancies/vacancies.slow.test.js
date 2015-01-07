var expect = require('chai').expect;
var request = require('request');
var app = require('../../../app');
var utils = require('../../../modules/utils');

describe('slow.vacancies service', function () {

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

    describe('/data/vacancies/', function () {

        //TODO:

        it('should return all vacancies for chainId 1100', function (done) {

            var options = {
                url: 'http://localhost:1337/api/data/vacancies/1100',
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {

                var vacancies = JSON.parse(body);

                expect(vacancies).to.be.an('array');
                expect(vacancies).to.have.length.above(5);

                return done(error);
            });
        });

        it('should return a vacancy item with id 7183', function (done) {

            var options = {
                url: 'http://localhost:1337/api/data/vacancies/1100?vacancyid=7183',
                headers: {
                    'authorization': utils.basicAuthentication()
                }
            };

            request(options, function (error, res, body) {

                var vacancyItem = JSON.parse(body);

                expect(vacancyItem).to.be.an('object');
                expect(vacancyItem).to.include.keys(['applicationurl', 'commence', 'companyname', 'contactpersonname']);
                expect(vacancyItem).to.have.deep.property('companyname', 'KIWI');

                return done(error);
            });
        });
    });
});