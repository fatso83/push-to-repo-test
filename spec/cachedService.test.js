var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');
var expect = require('chai').expect;
var l4j = require('log4js');


describe('cachedService', function () {
    var requestBody = {
        serviceId: 'someExternalService',
        frameworkVersion: '5.0.0',
        headers : []
    };
    var responseObj = {
        serviceId: requestBody.serviceId,
        response: {
            code: 200,
            origin: 'ngt',
            data: {some: 'made up data'}
        }
    };
    var cachedService;
    var externalRequestStub;

    this.timeout(200);


    beforeEach(function () {
        externalRequestStub = {};
        var redisCacheStub = {
            db: {},

            cache: function (key, val, cb) {
                var cached = this.db[key] =val;
                cb(cached);
            },

            get: function (key, cb) {
                var val = this.db[key];
                cb( val && { data : val, status : 'success' } || { status : 'error'});
            },

            delete: function (key, cb) {
                delete this.db[key];
                cb();
            }
        };

        cachedService = proxyquire('../modules/request_helpers/cachedService', {

            /* needed for verification */
            './externalRequest': externalRequestStub,

            // no need for firing up redis
            './../caching/redisCache': redisCacheStub,

            /* the request library takes 140 ms just to load! */
            'request' : {}
        });
    });

    it('should not cache subsequent requests', function () {
        var dummy = sinon.stub();
        var spy = externalRequestStub.makeRequest = sinon.spy(function (request, callback) {
            callback(responseObj);
        });

        cachedService.fetch(requestBody, dummy);
        cachedService.fetch(requestBody, dummy);
        cachedService.fetch(requestBody, dummy);
        cachedService.fetch(requestBody, dummy);
        expect(spy.callCount).to.equal(1);
        expect(dummy.callCount).to.equal(4);
    });

});