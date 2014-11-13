var server,
    log4js = require('log4js');

/**
 * @param callback for integration testing
 */
function main(callback) {

    var express = require('express'),
        compress = require('compression'),
        cors = require('cors'),
        logger = require('morgan'),
        bodyParser = require('body-parser'),
        cookieParser = require('cookie-parser'),
        path = require('path'),
        debug = require('debug')('ng-azure-rest-api');

    // Set global logging level
    if (process.env.NODE_ENV === 'production') {
        logger.setLevel(log4js.levels.OFF);
    }

    // Routes
    var request = require('./routes/request');
    var index = require('./routes/index');


    // Warm up caches
    var cacheWarmer = require('./modules/caching/boot-script');
    cacheWarmer.start();

    // Setup the search module
    var searchUtil = require('./modules/productSearch/searchUtil');
    // Start loading data when the server starts
    searchUtil.loadData();

    var app = express();
    server = require('http').createServer(app);

    app.set('port', process.env.PORT || 3000);

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
    app.use('/FindStore', require('./routes/find-store'));

    // Catch 404 and forwarding to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        err.message = "That route does not exist";
        next(err);
    });

    server.listen(app.get('port'), function () {
        callback && callback();
    });
}

/**
 * expose stop and start functions for testing
 */

exports.stop = function (callback) {
    server.close();
    server.on('close', callback);
};

exports.start = function (cb) {
    main(cb);
};

/* start as normal if run directly from node */
if (require.main === module) {
    main(console.log.bind(console, 'Express server listening'));
}

