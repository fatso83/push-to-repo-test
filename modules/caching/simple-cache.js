function SimpleCache() {
    this.db = {};
}

/** Singleton method - making it possible to share a global in-mem cache */
var instance = null;
SimpleCache.getSharedInstance = function () {
    if (!instance) {
        instance = new SimpleCache();
    }

    return instance;
};

SimpleCache.prototype.set = function (key, val) {
    this.db[key] = val;
};

SimpleCache.prototype.get = function (key) {
    return this.db.hasOwnProperty(key) ? this.db[key] : null;
};

module.exports = SimpleCache;
