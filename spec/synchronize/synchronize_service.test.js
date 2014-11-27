/**
 * @author carl-erik.kopseng
 * @date   28.05.14.
 */

var expect = require('expect.js'),
	service,
	storage,
	bigDb,
	userDb,
	userId = 1000,
	chainId = 123,
	log4js = require('log4js'),
	logger = log4js.getLogger('Synchronize Service');


describe('Synchronize service', function () {

	beforeEach(function () {
		storage = require('../../modules/synchronize/storage/InMemStorage');
		bigDb = storage.__internalDb();
		bigDb[chainId] = {};
		userDb = bigDb[chainId][userId] = {};
		userDb['someItemAddedByOtherDevice'] = {
			key     : 'someItemAddedByOtherDevice',
			version : 34,
			data    : { foo : 'jalla!'}
		};
		service = require('../../modules/synchronize/service');
		service.setStorage(storage);
		logger.setLevel(log4js.levels.OFF);
	});


	describe('synchronize', function () {

		it('should throw error if missing params', function () {
			expect(service.synchronize).to.throwError();
		});

		it('should return all db content as updated and addedKeys if called without parameters', function (done) {
			addDummyEntity('dummy');
			addDummyEntity('dummy2');

			service.synchronize(chainId, userId, {}, function (err, latestChanges) {
				if (err) {
					done(err);
					return;
				}

				var updated = latestChanges.updated;
				var updatedKeys = updated.map(function (obj) { return obj.key; });
				var addedKeys = latestChanges.addedKeys;
				expect(updated).to.contain(userDb['someItemAddedByOtherDevice' ]);

				expect(addedKeys.sort()).to.eql(updatedKeys.sort());
				expect(latestChanges.removedKeys).to.be.empty();
				expect(latestChanges.conflicts).to.be.empty();
				done();
			});
		});

		it('should not return updates for items for which you have the latest version', function (done) {
			var clientChanges = {
				unchanged : [
					{ key : 'someItemAddedByOtherDevice', version : 34}
				]
			};

			service.synchronize(chainId, userId, clientChanges, function (err, latestChanges) {
				expect(latestChanges.addedKeys).to.be.empty();
				expect(latestChanges.updated).to.be.empty();
				done();
			});
		});

		it('should fill removedKeys with keys not in the database', function (done) {
			var changes = {
				unchanged : [
					{ key : 'fooRemoved', version : 3},
					{ key : 'someItemAddedByOtherDevice', version : 34}
				]
			};
			service.synchronize(chainId, userId, changes, function (err, latestChanges) {
				expect(latestChanges.updated).to.be.empty();
				expect(latestChanges.removedKeys).to.be.eql(['fooRemoved']);
				done();
			});
		});


		it('should return the keys in removedKeys if the client asks for a key not in the database', function (done) {
			var clientChanges = {
				unchanged   : [
					{ key : 'fooRemoved', version : 3},
					{ key : 'someItemAddedByOtherDevice', version : 34}
				],
				updated     : [],
				removedKeys : []
			};
			service.synchronize(chainId, userId, clientChanges, function (err, latestChanges) {
				expect(latestChanges.updated).to.be.empty();
				expect(latestChanges.removedKeys).to.be.eql(['fooRemoved']);
				done();
			});
		});


		it('should return an array of conflicting changes', function (done) {
			var versionNumberLessThanOnServer = 8;
			var clientChanges = {
				unchanged : [
					{key : 'someItemAddedByOtherDevice', version : 34 }
				],
				updated   : [
					{
						key     : 'fooBar',
						version : versionNumberLessThanOnServer,
						data    : 'data_version_13'
					}
				]
			};

			addDummyEntity('fooBar', 13, 'data_version_13');

			service.synchronize(chainId, userId, clientChanges, function (err, latestChanges) {
				expect(latestChanges.updated).to.be.empty();
				expect(latestChanges.removedKeys).to.be.empty();
				expect(latestChanges.conflicts).to.eql([
					{
						key           : 'fooBar',
						clientVersion : versionNumberLessThanOnServer,
						serverVersion : 13,
						latest        : 'data_version_13'
					}
				]);
				done();
			});
		});

		it('should return the updated object with version set to 1 for new items', function (done) {
			var clientChanges = {
				unchanged   : [
					{ key : 'someItemAddedByOtherDevice', version : 34}
				],
				updated     : [
					{ key : 'new_from_client', data : 'the client cannot set the version'}
				],
				removedKeys : []
			};

			service.synchronize(chainId, userId, clientChanges, function (err, latestChanges) {
				expect(latestChanges.updated).to.eql([
					{
						key : 'new_from_client', data : 'the client cannot set the version', version : 1}
				]);
				done();
			});
		});


		it('should report updated keys not in database as removed', function (done) {
			this.timeout(100);
			service.synchronize(1100, 1234, {
					"unchanged"   : [
						{"key" : "fw_notification_storage", "version" : 1}
					],
					"updated"     : [
						{"key" : "counter", "version" : 22, "data" : 0}
					],
					"removedKeys" : []
				}, function(err, result) {
					try {
						expect(result.removedKeys).to.contain('fw_notification_storage');
						expect(result.removedKeys).to.contain('counter');
						done();
					} catch(ex) { done(ex); }
				}
			)
		})
	});
});

/**
 * Add an entity
 * @param key
 * @param [version] optional. Else a random version
 * @param [data] optional. Else random data
 */
function addDummyEntity (key, version, data) {
	userDb[key] = { key : key, data : data || 'data__' + key, version : version || (1 + Math.random() * 10 >> 0)};
}
