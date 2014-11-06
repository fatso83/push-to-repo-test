var server;

function main(cb) {

    var express = require('express'),
        compress = require('compression'),
        cors = require('cors'),
        logger = require('morgan'),
        log4js = require('log4js'),
        bodyParser = require('body-parser'),
        cookieParser = require('cookie-parser'),
        path = require('path'),
        debug = require('debug')('ng-azure-rest-api');

// Set global caching level
    log4js.setGlobalLogLevel(log4js.levels.INFO);
    //log4js.setGlobalLogLevel(log4js.levels.TRACE);

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

// TODO: App Routes
    app.use('/', index);
    app.use('/request', request);

// Catch 404 and forwarding to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        err.message = "That route does not exist";
        next(err);
    });

    server.listen(app.get('port'), function () {
        console.log('Express server listening');
        cb && cb();
    });
}

// start as normal if run directly from node
if (require.main === module) {
    main();
}

// export stop and start functions for testing
exports.stop = function (callback) {
    server.close();
    server.on('close', callback);
};

exports.start = function(cb) {
    main(cb);
};

