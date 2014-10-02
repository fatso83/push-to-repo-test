/**
 *
 * Transaction exposes a class which can be used to mimic the some functionality of a batch operation.
 * @type {exports.EventEmitter|*}
 */

var EventEmitter = require('events').EventEmitter;
var util = require("util");

/**
 *
 * @constructor
 */
function Transaction() {
    this.batchSize = 0;
    this.completed = 0;
    this.errors = 0;
    this.transactionErrors = [];
    EventEmitter.call(this);
}

util.inherits(Transaction, EventEmitter);

/**
 *
 * @param {number} operations
 */
Transaction.prototype.start = function (operations) {
    this.batchSize = operations;
};

Transaction.prototype.commit = function (error) {
    this.completed += 1;
    if (error) {
        this.errors += 1;
        this.transactionErrors.push(error);
    }

    if (this.batchSize === this.completed) {
        if (this.errors > 0) {
            this.emit('completed', this.transactionErrors);
        } else {
            this.emit('completed', null);
        }
    }
};

module.exports = Transaction;