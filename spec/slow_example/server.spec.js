// Example tests taken from the NGSharingPrototypeServer project

//
//var originalExpect = require('expect.js'),
//	sinon = require('sinon'),
//	expect = require('sinon-expect').enhance(originalExpect, sinon, 'was'),
//	request = require('request'),
//	Server = require('../../src/server'),
//	ShoppingListService = require('../../src/ShoppingListService'),
//	factory = require('./../factory-util'),
//	port = 8000,
//	baseUri = 'http://localhost:' + port,
//	sharingUri = [baseUri, 'api/v1/deling', 1000].join('/');
//
//function createPostOptions (uri, lastUpdatedTime, shoppinglists) {
//	var opts = {
//		uri  : uri,
//		json : { lastUpdatedTime : lastUpdatedTime, shoppinglists : shoppinglists }
//	};
//	return opts;
//}
//
//describe('Server HTTP spec', function () {
//	var server;
//
//	before(function (done) {
//		server = new Server;
//		server.setService(ShoppingListService.withInMemoryStorage());
//		server.start(port, done);
//	});
//
//	after(function () {
//		try { server.stop(); } catch (e) { /* ignore */ }
//	});
//
//	describe('/', function () {
//		var uri = baseUri + '/';
//
//		it('should return 200', function (done) {
//			request.get(uri, function (error, res, body) {
//				expect(res.statusCode).to.be(200);
//				done();
//			});
//		});
//
//		it('should return info screen', function (done) {
//			request.get(uri, function (error, res, body) {
//				expect(body).to.match(/Sharing server/);
//				done();
//			});
//		});
//	});
//
//	describe('/api/v1/deling/{chainid}/', function () {
//		var uri = sharingUri;
//
//		it('should return 200 on a successful GET', function (done) {
//			request.get([uri, '?lastUpdatedTime=', (new Date()).toISOString()].join(""), function (error, res, body) {
//				expect(res.statusCode).to.be(200);
//				done(error);
//			});
//		});
//
//		it('should return a timestamp in ISO8601 format on a successful GET', function (done) {
//			request.get([uri, '?lastUpdatedTime=', (new Date()).toISOString()].join(""), function (error, res, body) {
//				var result = JSON.parse(body);
//				var iso8601regexp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,3}((\+|\-)\d{2}:\d{2})|(Z)$/;
//
//				expect(result.requestedTime).to.match(iso8601regexp);
//				done(error);
//			});
//		});
//
//		// should not care about implementing the whole set of http response codes. leave it to norgesdata
//		it('should return 201 on a successful POST', function (done) {
//			var opts = createPostOptions(uri, "2012-12-26T13:00:20.000+01:00", [factory.createShoppingList()]);
//
//			request.post(opts, function (error, res, body) {
//				expect(res.statusCode).to.be(201);
//				done(error);
//			});
//		});
//
//		it('should return 500 on wrong content type', function (done) {
//			var opts = {
//				method : 'POST',
//				uri    : uri,
//				body   : '{ lastUpdatedTime : "2012-12-26T13:00:20.000+01:00", shoppinglists   : [] }'
//			};
//
//			request.post(opts, function (error, res, body) {
//				expect(res.statusCode).to.be(500);
//				done();
//			});
//		});
//
//		it('should return 400 on missing lastUpdatedTime', function (done) {
//			var opts = {
//				method : 'POST',
//				uri    : uri,
//				json   : { shoppinglists : [] }
//			};
//
//			request.post(opts, function (error, res, body) {
//				expect(res.statusCode).to.be(400);
//				done();
//			});
//		});
//
//		it('should return 400 on wrong formatted lastUpdatedTime', function (done) {
//			var opts = {
//				method : 'POST',
//				uri    : uri,
//				json   : { lastUpdatedTime : "2012-12-26T13:00:20", shoppinglists : [] }
//			};
//
//			request.post(opts, function (error, res, body) {
//				expect(res.statusCode).to.be(400);
//				done();
//			});
//		});
//	});
//});
//
//describe('Slow server tests', function () {
//	var uri = sharingUri, server;
//
//	beforeEach(function (done) {
//		this.timeout(2500); // creation of tables usually last up to 1,5 seconds
//		server = new Server();
//		server.setService(ShoppingListService.withInMemoryStorage());
//		server.start(port, done);
//	});
//
//	afterEach(function () {
//		try { server.stop(); } catch (e) { /* ignore */ }
//	});
//
//	it('should block on no new content when enabling long polling', function (done) {
//		var lastUpdated = (new Date).toISOString();
//		var fullUri = [uri, '?enableLongPolling=true', '&lastUpdatedTime=', lastUpdated].join("");
//		request.get({ uri : fullUri, timeout : 100 }, function (error, res, body) {
//			expect(error).to.be.ok();
//			done();
//		});
//	});
//
//	it('should reply a long polling GET on the first POST', function (done) {
//		var postFinished = false;
//
//		var lastUpdated = (new Date).toISOString();
//		var fullUri = [uri, '?enableLongPolling=true', '&lastUpdatedTime=', lastUpdated].join("");
//		request.get({ uri : fullUri, timeout : 100 }, function (error, res, body) {
//			expect(postFinished).to.be(true);
//			done();
//		});
//
//		request.post(createPostOptions(uri, "2012-12-26T13:00:20.000+01:00", []), function (error, res, body) {
//			postFinished = true;
//		});
//	});
//
//	it('should reject updates with empty shoppinglists', function (done) {
//		request.post(createPostOptions(uri, "2012-12-26T13:00:20.000+01:00", []), function (error, res, body) {
//			expect(res.statusCode).to.be(400);
//			done(error);
//		});
//	});
//
//	it('should upon a POST return all change sets added to server since "lastUpdateTime"', function (done) {
//		var timeA = new Date(Date.now() - 1000),
//			timeB = new Date(Date.now() - 500),
//			change1 = factory.createShoppingList({id : 'id1'}),
//			change2 = factory.createShoppingList({id : 'id2'});
//
//		request.post(createPostOptions(uri, timeB, [ change1]), function (error, res, body) {
//			expect(body.shoppinglists).to.be.empty();
//			request.post(createPostOptions(uri, timeA, [ change2]), function (error, res, body) {
//				expect(body.shoppinglists).to.have.length(1);
//				expect(body.shoppinglists[0].id).to.be('id1');
//				done();
//			});
//		});
//	});
//
//	it('should upon a GET call the ShoppingListService.getAllShoppingListChanges if "lastUpdatedTime" is not given', function (done) {
//		var Promise = require('rsvp').Promise;
//		var spy = sinon.stub().returns(new Promise(function (resolve) { resolve([])}));
//		server.setService({ getAllShoppingListChanges : spy });
//		request.get(sharingUri, function (error, res, body) {
//			expect(spy).was.calledOnce();
//			done(error);
//		});
//	});
//});

