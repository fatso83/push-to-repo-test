var redis = require('./utils/redis-cache-stub');
var expect = require('chai').expect;
var sinon = require('sinon');
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
        responseObj = {
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
            callback(responseObj);
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
});
