var config = require('../lib').config,
    expect = require('chai').expect;

describe('config', function () {

    it('should expose a property "interactive"', function() {
        console.log(config.interactive);
        expect(config).to.have.property('interactive');
    });
});