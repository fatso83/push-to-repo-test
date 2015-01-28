var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');
var testConfig = require('../../integration-test-config');

describe('slow.integration.mirrors.shopping-list-group service', function () {

    this.timeout(testConfig.timeout.HALF_MINUTE);

    var mock = {
        URL: testConfig.URL + 'api/data/vacancies/' + testConfig.chainId,
        vacancyId: null
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

    describe('/data/vacancies/', function () {

        it('should return all vacancies for chainId ' + testConfig.chainId, function (done) {
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
                mock.vacancyId = vacancies[0].vacancyid;
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

