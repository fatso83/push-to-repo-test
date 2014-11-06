/**
 * Created by carl-erik.kopseng on 05.11.14.
 */

var log4js = require('log4js');
//log4js.getLogger().info('DISABLING LOGGING OUTPUT');
log4js.setGlobalLogLevel(log4js.levels.OFF);

var handler = require('../../modules/requestHandler');
var expect = require('chai').expect;


describe('slow.requestHandler', function () {

    it('should make a request to the backend', function (done) {

        this.timeout(5000);

        handler.handleRequest({
            serviceId: 'someExternalService',
            frameworkVersion: '5.0.0',
            servicename: 'storesGetStore',
            environment: 'preprod',
            servicepath: 'api/findstore/stores/1100',
            servicemethod: 'GET',
            headers: [{Authorization: 'Basic J8ed0(tyAop206%JHP'}]
        }, function (result) {
            expect(result.response.code).to.equal(200);
            expect(result.response.data.length).to.be.greaterThan(100);
            done();
        });

    });

});