var expect = require('chai').expect;

var requestBuilder = require('../modules/request_helpers/request-builder');

describe('Request builder', function () {

    it('should set the environment to the configured value', function() {
       requestBuilder.setConfig({
           caching : { environment : 'my-environment'}
       });

        var res = requestBuilder.createRequestBody(
            {
                servicepath : '/foobar/baz',
                servicename : 'myservice'
            }
        );
        expect(res.environment).to.equal('my-environment');
    });
});
