var FOREVER = 60 * 60 * 24 * 365 * 100;
var RequestCacher = require('./request-cacher');
var logger = require('log4js').getLogger('PollingRequestCacher');

var PollingRequestCacher = function () {
    this.requestOptionsList = [];
    this.intervals = [];
    this.running = false;
};

PollingRequestCacher.prototype.start = function () {
    this.intervals = this.requestOptionsList.map(function (opts) {

        var defaultLogger = function () {
            logger.info('Refreshing cache for ' + opts.request.servicepath);
        };

        var doRequest = function () {
            opts.requestCacher.refresh(opts.request, function () {
                var fn = opts.refreshHandler || defaultLogger;

                try {
                    fn.apply(null, arguments);
                } catch (err) {
                    /* cannot allow the refreshHandler to take down the server */
                }
            });
        };

        // refresh immediately
        doRequest();

        // set up refresh at regular intervals
        return setInterval(doRequest, opts.intervalInSeconds * 1000);
    });
};

PollingRequestCacher.prototype.stop = function () {
    this.intervals.forEach(clearInterval);
};


/**
 * Adds a request that should be refreshed regularly
 * @param req
 * @param opts options (some mandatory)
 * @param opts.intervalInSeconds the intervalInSeconds between each refresh (in seconds)
 * @param [opts.refreshHandler] function to call on success. Do nothing as default
 *
 * Internal:
 * @param opts.requestCacherStub
 */
PollingRequestCacher.prototype.addRequest = function (req, opts) {
    if (this.running) {
        throw new Error('Tried adding request to running request cacher. Stop it, add the request, and start it again');
    }

    var requestCacher = opts.requestCacherStub || new RequestCacher({
            maxAgeInSeconds: FOREVER,
            maxStaleInSeconds: FOREVER
        });
    this.requestOptionsList.push({
            request: req,
            requestCacher: requestCacher,
            intervalInSeconds: opts.intervalInSeconds,
            refreshHandler: opts.refreshHandler
        }
    );
};

module.exports = exports = PollingRequestCacher;



