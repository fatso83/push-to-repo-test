var SimpleCache = require('../modules/caching/simple-cache');
var expect = require('chai').expect;

describe('SimpleCacher', function() {

    describe('constructor', function() {

        it('should never return the same instance', function() {
            expect(new SimpleCache()).to.not.equal(new SimpleCache());
        });

    });

    describe('#getSharedInstance', function() {

        it('should return the same instance each time', function() {
            expect(SimpleCache.getSharedInstance()).to.equal(SimpleCache.getSharedInstance());
        });

    });
});