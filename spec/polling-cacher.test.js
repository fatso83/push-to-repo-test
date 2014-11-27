var sinon = require('sinon');
var expect = require('chai').expect;

var PollingCacher = require('../modules/caching/polling-cacher');

describe('PollingCacher', function () {

    this.timeout(100);

    var requestBody = {
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

    function createRequestCacherStub() {
        return {
            handleRequest: sinon.spy(function (req, cb) {
                cb(responseObj);
            }),

            refresh: sinon.spy(function (req, cb) {
                cb(responseObj);
            })
        };
    }

    it('should trigger a refresh immediately on start()', sinon.test(function () {
        var p = new PollingCacher();

        var reqCacherStub = createRequestCacherStub();

        p.addRequest(requestBody, {
            intervalInSeconds: 60,
            requestCacherStub: reqCacherStub,
            refreshHandler: this.stub()
        });
        p.start();

        this.clock.tick(100);

        expect(reqCacherStub.refresh.callCount).to.equal(1);
    }));

    it('should force cache refreshes as configured', sinon.test(function () {
        var p = new PollingCacher();

        var reqCacherStub = createRequestCacherStub();

        p.addRequest(requestBody, {
            intervalInSeconds: 60,
            requestCacherStub: reqCacherStub,
            refreshHandler: this.stub()
        });
        p.start();

        this.clock.tick(1000 * 61 * 2);
        expect(reqCacherStub.refresh.callCount).to.equal(3);

    }));

    // not sure how to test this
    //it('should tells its internal cacher to keep using the cache in case of network errors', sinon.test(function () {
    //    var p = new PollingCacher();
    //    p.addRequest(requestBody, {
    //            intervalInSeconds: 60 * 60
    //        }
    //    );
    //}));
});