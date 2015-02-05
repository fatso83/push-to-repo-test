var lib = require('../lib'),
    expect = require('chai').expect;

describe('lib', function () {

    it('should expose a config property', function() {
        expect(lib).to.have.property('config');
    });
});