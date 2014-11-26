// simple in-mem "db" for testing/transition to Azure
var db = {};

function ensureUserDbExists(chainId, userId) {
	if(db[chainId] === undefined) db[chainId] = {};
	if(db[chainId][userId] === undefined) db[chainId][userId] = {};
}

function getUserDb(chainId, userId) {

	ensureUserDbExists(chainId,userId);

	return db[chainId][userId];
}

module.exports = {
	getUserData : function(chainId, userId, callback) {
		callback(null, getUserDb(chainId,userId));
	},
	setUserData : function(chainId, userId, data, callback) {
		ensureUserDbExists(chainId,userId);

		db[chainId][userId] = data;
		callback();
	},

	// for testing
	__internalDb : function(){
		return db;
	}
};