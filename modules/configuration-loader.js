/**
 * Static configuration loader
 *
 * Passing configuration objects down the stack is developer unfriendly.
 * One should of course still use dependency injection when testing the modules,
 * so make your objects hybrids; accepting both config objects and use defaults otherwise
 */

var seraphim = require('seraphim');
var logger = require('log4js').getLogger('Configuration Loader');
var calledButNotLoaded, cachedConfig, queue = [];

/**
 * Load configuration from files and set any overrides.
 * @param overrides any options to override
 * @param callback called with the config object as argument
 */
function loadConfiguration(overrides, callback) {
    var nodeenv = process.env.NODE_ENV,
        port = process.env.PORT,
        s = seraphim.createVault()
            .on('error', logger.error.bind(logger))
            //Default settings
            .load({disable: {}})
            .load("defaults.json");

    //NODE_ENV (development/production/<none>) settings
    if (nodeenv) {
        s.load(nodeenv + ".json");
    }
    if (port) {
        s.load({port: port});
    }

    s.load(overrides)
        .on('end', logger.debug.bind(logger, 'Configuration loaded:\n'))
        .on('end', function (config) {
            cachedConfig = config;
            callback(config);

            var i = queue.length;
            while (i--) {
                queue[i](config);
            }
            queue = [];
            calledButNotLoaded = false;
        });
}

/**
 * Async loader of configuration values
 * @param [overrides] optional overrides (only valid/used for first call)
 * @param callback
 */
exports.load = function (overrides, callback) {
    var opts, cb,
        hasOverrides = overrides && Object.keys(overrides).length;

    if (typeof overrides === 'function') {
        cb = overrides;
        opts = {};
    } else if (typeof callback === 'function') {

        cb = callback;
        opts = overrides;

        // clean cache if someone specified overrides
        if (hasOverrides) {
            cachedConfig = null;
        }

    } else {
        throw new Error('Expects a callback function');
    }

    // load from memory after first load
    // - ignore overrides (don't really see a use case except for first-time loading)
    if (cachedConfig) {
        cb(cachedConfig);
    }
    else if (calledButNotLoaded && !hasOverrides) {
        queue.push(cb);
    }
    else {
        loadConfiguration(opts, cb);

        // set flag
        calledButNotLoaded = true;
    }
};
