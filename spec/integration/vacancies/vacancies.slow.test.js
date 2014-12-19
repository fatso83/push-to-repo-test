var expect = require('chai').expect;
var assert = require('chai').assert;

var request = require('request');
var app = require('../../../app');

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
        it('should return all vacancies for chainId 1100', function (done) {
            request.get('http://localhost:1337/api/data/vacancies/1100', function (error, res, body) {

                var vacancies = JSON.parse(body);

                expect(vacancies).to.be.an('array');
                expect(vacancies).to.have.length.above(5);

                return done(error);
            });
        });

        it('should return a vacancy item with id 7183', function (done) {
            request.get('http://localhost:1337/api/data/vacancies/1100?vacancyid=7183', function (error, res, body) {

                var vacancyItem = JSON.parse(body);

                expect(vacancyItem).to.be.an('object');
                expect(vacancyItem).to.include.keys(['applicationurl','commence','companyname','contactpersonname']);
                expect(vacancyItem).to.have.deep.property('companyname', 'KIWI');

                return done(error);
            });
        });

        it('should have description', function (done) {
            done();
        });

    });

});