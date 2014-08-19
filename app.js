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
var synchronize = require('./routes/synchronize_router');
var index = require('./routes/index');

// Setup the search module
var searchUtil = require('./modules/productSearch/searchUtil');
// Start loading data when the server starts
searchUtil.loadData();

var app = express();
var server = require('http').createServer(app);

app.set('port', process.env.PORT || 3000);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(compress());
app.use(cors());
app.use(logger('dev'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// TODO: App Routes
app.use('/', index);
app.use('/request', request);
app.use('/synchronize', synchronize);

// Catch 404 and forwarding to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    err.message = "That route does not exist";
    next(err);
});

server.listen(app.get('port'), function () {
    console.log('Express server listening');
});

