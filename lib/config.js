var _ = require('lodash');
var util = require('util');
var tty = require('tty');
var fse= require('fs-extra');

var config = {};

if (config.interactive == null) {
    config.interactive = ( tty.isatty(1) && !process.env.CI );
}

config.environment = {};

config.load = function(path_to_configuration) {
    var userConfig;

    try {
        userConfig = fse.readJSONFileSync(path_to_configuration);
    } catch(error) {
        console.log('Did not find the configuration file: ' + path_to_configuration);
        console.log('Are you outside of a project directory, or is the config file missing?');
        process.exit(1);
    }

    _.extend(config, userConfig)
};

module.exports = config;