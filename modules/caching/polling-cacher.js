
var FOREVER = 60*60*24*365*100;
var RequestCacher = require('./request-cacher');

var PollingRequestCacher = function() {
    this.requestOptionsList = [];
    this.intervals = [];
    this.running = false;
};

PollingRequestCacher.prototype.start = function() {
    this.intervals = this.requestOptionsList.map(function(opts) {
        var doRequest = function () { opts.requestCacher.refresh(opts.request, opts.refreshHandler); };

        // refresh immediately
        doRequest();

        // set up refreshe at sregular intervals
        return setInterval(doRequest, opts.intervalInSeconds*1000);
    });
};

PollingRequestCacher.prototype.stop = function() {
    this.intervals.forEach(clearInterval);
};


/**
 * Adds a request that should be refreshed regularly
 * @param req
 * @param opts.intervalInSeconds the intervalInSeconds between each refresh (in seconds)
 *
 * Internal:
 * @param opts.requestCacherStub
 */
PollingRequestCacher.prototype.addRequest= function(req, opts) {
    if(this.running) {
        throw new Error('Tried adding request to running request cacher. Stop it, add the request, and start it again');
    }

    var requestCacher = opts.requestCacherStub || new RequestCacher({ maxAge : FOREVER } );
    this.requestOptionsList.push( {
            request : req,
            requestCacher : requestCacher,
            intervalInSeconds : opts.intervalInSeconds,
            refreshHandler : opts.refreshHandler
        }
    );
};

module.exports = exports = PollingRequestCacher;



