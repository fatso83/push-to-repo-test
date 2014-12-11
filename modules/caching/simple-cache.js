function SimpleCache() {
    this.db = {};
}

SimpleCache.prototype.set = function (key,val) {
    this.db[key] = val;
};

SimpleCache.prototype.get = function (key) {
    return this.db.hasOwnProperty(key) ? this.db[key] : null;
};

module.exports = SimpleCache;
