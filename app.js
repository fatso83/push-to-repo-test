// do not remove - module containing state
require('newrelic');

var server,
    config = require('./modules/configuration-loader'),
    log4js = require('log4js'),

    //http://stackoverflow.com/questions/27101171/pattern-for-ifrequire-main-that-works-on-azures-iisnode/27151366
    runningIISNode = require.main.filename.match(/iisnode/);

/**
 * @param callback for integration testing
 */
function main(config, callback) {

    var express = require('express'),
        compress = require('compression'),
        cors = require('cors'),
        logger = require('morgan'),
        bodyParser = require('body-parser'),
        cookieParser = require('cookie-parser'),
        path = require('path'),
        debug = require('debug')('ng-azure-rest-api');

    // Routes
    var request = require('./routes/request');
    var index = require('./routes/index');

    var app = express();
    server = require('http').createServer(app);

    app.set('port', config.port);

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    app.use(compress());
    app.use(cors());
    app.use(logger('dev'));

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use(cookieParser());

    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/', index);
    app.use('/request', request);

    app.use('/api/uidata/brandmatch', require('./routes/brand-match'));

    app.use('/api/FindStore', require('./routes/find-store'));

    app.use('/api/data/shoppinglistgroup', require('./routes/shopping-list-group'));
    app.use('/api/data/vacancies', require('./routes/vacancies'));

    // Catch 404 and forwarding to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');

        err.status = 404;
        err.message = "That route does not exist";

        next(err);
    });

    server.listen(app.get('port'), function () {

        // Warm up caches
        if (!config.disable['cache-warmup']) {
            var cacheWarmer = require('./modules/caching/boot-script');
            cacheWarmer.start();
        }

        if (!config.disable['product-module']) {
            // Load data needed for the search module
            var searchUtil = require('./modules/productSearch/searchUtil');
            searchUtil.loadData(function () {

                // finally everything has been setup
                if (callback) {
                    callback();
                }
            });
        } else { callback(); }

    });
}

/**
 * expose stop and start functions for testing
 */

exports.stop = function (callback) {
    server.close();
    server.on('close', callback);
};

exports.start = function (overrides, cb) {
    config.load(overrides, function (config) {
        main(config, cb);
    });
};

/*
 *  start as normal if run directly from node
 *  special treatment in the case of running IISNode (Azure)
**/
if (require.main === module || runningIISNode) {

    config.load(function (config) {
        main(config, console.log.bind(console, 'Express server listening at :' + config.port ));
    });
}