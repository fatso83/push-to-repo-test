var expect = require('chai').expect;

describe('slow.user-token-cache', function () {

    this.timeout(6000);

    var userTokenCache = null;
    var testToken = 'testToken-3';

    before(function (done) {
        userTokenCache = require('../../../modules/caching/user-token-cache');
        done();
    });

    describe('user token cache', function () {

        it('should save a user token', function (done) {
            userTokenCache.saveToken(testToken, true, function (error, result) {
                done(error);
            });
        });

        it('should get token from cache', function (done) {
            userTokenCache.hasValidToken(testToken, function (error, result) {
                done(error);
            });
        });
    });

});