'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;
var l4j = require('log4js');

// turn off loggign
var loggerNames = ['Version Number Utils', 'Request Handler'];
loggerNames.forEach(function(name){
    var logger = l4j.getLogger(name);
    logger.setLevel(l4j.levels.OFF);
});

describe('requestHandler - fast unit tests', function () {
    var requestData = {servicename: 'someExternalService', frameworkVersion: '5.0.0', servicepath : '/asdfasdf'};
    var handler;
    var internalRequestStub;
    var externalRequestStub;

    this.timeout(100);

    beforeEach(function () {
        var proxyquire= require('proxyquire').noCallThru();

        internalRequestStub = {};
        externalRequestStub = {};

        handler = proxyquire('../modules/requestHandler', {
                './request_helpers/internalRequest': internalRequestStub,
                './request_helpers/externalRequest': externalRequestStub
            });
    });

    it('should fail a request missing frameworkVersion with a response code 403', function (done) {
        handler.handleRequest({serviceName: 'someLocalService'}, function (data) {
            expect(data.response.code).to.equal(403);
            done();
        });
    });

    it('should route a "local service" to an internal request', function (done) {
        internalRequestStub.isLocalService = sinon.stub().returns(true);
        internalRequestStub.makeRequest = function(data) { done(); };
        
        handler.handleRequest(requestData, sinon.stub() );
    });

    it('should route a "non local service" (NGT) as an external request', function (done) {
        internalRequestStub.isLocalService = sinon.stub().returns(false);
        externalRequestStub.makeRequest = function(data) { done(); };

        handler.handleRequest(requestData, sinon.stub() );
    });

});