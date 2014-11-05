var createRedisCacheStub = function () {
    return {
        db: {},
        get: function (key, cb) {
            var result = {status: "success", error: null, data: null};
            var data = this.db[key];
            if (data) {
                result.data = data;
            }
            else {
                result.status = "error";
                result.error = "Key not found";
            }
            cb(result);
        },
        cache: function (key, val, cb) {
            this.db[key] = val;
            cb({status: "success", error: null});
        }
    };
};

exports.create = createRedisCacheStub();
