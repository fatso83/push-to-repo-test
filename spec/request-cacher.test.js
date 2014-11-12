var redis = require('./utils/redis-cache-stub');
var expect = require('chai').expect;
var sinon = require('sinon');
var _ = require('lodash');
var RequestCacher = require('../modules/caching/request-cacher');

describe('RequestCacher', function () {


    var redisCacheStub, spy, cacher,
        externalRequestStub = {},
        requestBody = {
            serviceId: 'someExternalService',
            servicepath: '/some/external/service?myparam=1',
            frameworkVersion: '5.0.0',
            headers: []
        },
        wrappedResponse = {
            serviceId: requestBody.serviceId,
            response: {
                code: 200,
                origin: 'ngt',
                data: {some: 'made up data'}
            }
        };

    beforeEach(function () {

        redisCacheStub = redis.create();
        spy = externalRequestStub.makeRequest = sinon.spy(function (request, callback) {
            callback(wrappedResponse);
        });

        cacher = new RequestCacher({
            maxAgeInSeconds: 1,
            stubs: {
                redisCache: redisCacheStub,
                externalRequest: externalRequestStub
            }
        });
    });

    it('should cache the request result', function () {

        cacher.handleRequest(requestBody, sinon.stub());
        cacher.handleRequest(requestBody, sinon.stub());
        cacher.handleRequest(requestBody, sinon.stub());

        expect(spy.callCount).to.equal(1);
        expect(Object.keys(redisCacheStub.db)).to.have.length(1);
    });

    it('should refresh the cache on old cache', sinon.test(function () {

        cacher.handleRequest(requestBody, sinon.stub());
        this.clock.tick(1.1 * 1000);
        cacher.handleRequest(requestBody, sinon.stub());

        expect(spy.callCount).to.equal(2);
        expect(Object.keys(redisCacheStub.db)).to.have.length(1);
    }));

    it('should be possible to explicitly force refresh of the cache ', sinon.test(function () {

        cacher.refresh(requestBody, sinon.stub());
        cacher.refresh(requestBody, sinon.stub());
        cacher.refresh(requestBody, sinon.stub());

        expect(spy.callCount).to.equal(3);
        expect(Object.keys(redisCacheStub.db)).to.have.length(1);
    }));

    it('should keep its cached result in case the request fails if configured to do so', sinon.test(function () {
        setupExternalRequestToOnlyRespondSuccessfullyOnce();

        cacher = new RequestCacher({
            maxStaleInSeconds: 1000,
            maxAgeInSeconds: 1,
            stubs: {
                redisCache: redisCacheStub,
                externalRequest: externalRequestStub
            }
        });

        var verifyResult = function (result) {
            expect(result).to.eql(wrappedResponse.response.data);
        };

        cacher.handleRequest(requestBody, verifyResult);
        this.clock.tick(5 * 1000);
        cacher.handleRequest(requestBody, verifyResult);
    }));

    it('should not keep stale caches longer than configured', sinon.test(function () {
        setupExternalRequestToOnlyRespondSuccessfullyOnce();

        cacher = new RequestCacher({
            maxStaleInSeconds: 1000,
            maxAgeInSeconds: 1,
            stubs: {
                redisCache: redisCacheStub,
                externalRequest: externalRequestStub
            }
        });

        var verifyResult = function (result) {
            expect(result).to.eql(wrappedResponse.response.data);
        };

        cacher.handleRequest(requestBody, verifyResult);
        this.clock.tick(5 * 1000);
        cacher.handleRequest(requestBody, verifyResult);
        this.clock.tick(1000 * 1000);
        cacher.handleRequest(requestBody, function(result, error) {
           expect(result).to.equal(null);
        });
    }));

    it('the hash function should treat the service path consistently as lowercase', function() {
        var req1 = _.extend({}, requestBody),
        req2 = _.extend({}, requestBody),
        hash = RequestCacher.hash;

        req1.servicepath = req1.servicepath.toUpperCase();
        req2.servicepath = req2.servicepath.toLowerCase();

       expect(hash(req1)).to.equal(hash(req2));
    });


    function setupExternalRequestToOnlyRespondSuccessfullyOnce() {
        var callCount = 0;
        externalRequestStub.makeRequest = function (request, callback) {
            callCount++;

            if (callCount === 1) {
                callback(wrappedResponse);
            }
            else {
                callback({
                    serviceId: requestBody.serviceId,
                    response: {
                        code: 500,
                        origin: 'ngt',
                        data: 'some error'
                    }
                });
            }
        };
    }

});
