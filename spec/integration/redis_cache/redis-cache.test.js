var redisCache = require('../../../modules/caching/redis-cache');
var expect = require('chai').expect;

describe('slow.integration.redis-cache', function () {

    it('should be able to overwrite an existing key', function (done) {
        var key = 'myKey';
        redisCache.cache(key, 'val1', function (res) {
            redisCache.get(key, function (res) {

                expect(res.data).to.equal('val1');

                redisCache.cache(key, 'val2', function (res) {
                    redisCache.get(key, function (res) {
                        expect(res.data).to.equal('val2');
                        done();
                    });
                });
            });
        });
    });
});