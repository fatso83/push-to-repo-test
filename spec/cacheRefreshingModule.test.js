/**
 * Created by carl-erik.kopseng on 29.10.14.
 */

var redis = require('./utils/redis-cache-stub');
var RequestCacher = require('../modules/caching/request_cacher');


describe.skip('RequestCacher', function () {

    it('should warm the cache', function () {
        var redisCacheStub = redis.create(),
            cacher = new RequestCacher({
                servicepaths: '/myService?param1=foo'
            }, {maxAge: 3600, cacher: redisCacheStub});

        cacher.start();
    });
});
