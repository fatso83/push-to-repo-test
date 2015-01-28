var expect = require('chai').expect;
var request = require('request');
var app = require('../../../../app');
var utils = require('../../../../modules/utils');
var testConfig = require('../../integration-test-config');

// This test assumes there are First Price products which are of category "Drikkevarer".

describe('slow.integration.mirrors.brandmatch service', function () {

    this.timeout(testConfig.timeout.HALF_MINUTE);

    var mock = {
        URL: testConfig.URL + 'api/uidata/brandmatch/' + testConfig.chainId,
        requestBody: {
            "brand": "First Price",
            "productdetailslist": [
                {
                    "orginalproductdetail": {
                        "id": null,
                        "title": "juice",
                        "subtitle": "",
                        "detailstype": 1,
                        "showicons": 0,
                        "icons": null,
                        "type": "group",
                        "category": "Drikkevarer"
                    },
                    "matchingproductdetails": null
                }
            ]
        }
    };

    before(function (done) {
        if(testConfig.isLocal()){
            return app.start(testConfig.appOverrides, done);
        }
        done();
    });

    after(function (done) {
        if(testConfig.isLocal()){
            return app.stop(done);
        }
        done();
    });

    describe('/uidata/brandmatch/', function () {
        it('should return all brandmatches for chainId ' + testConfig.chainId + ' with given example', function (done) {

            var options = {
                url: mock.URL,
                method: 'POST',
                headers: {
                    'authorization': utils.basicAuthentication()
                },
                json: true,
                body: mock.requestBody
            };

            request(options, function (error, res, body) {

                var requestMatchingProductDetailsLength = body.productdetailslist[0].matchingproductdetails.length;
                expect(requestMatchingProductDetailsLength).to.be.above(1);

                var requestCategoryName = mock.requestBody.productdetailslist[0].orginalproductdetail.category;
                body.productdetailslist[0].matchingproductdetails.forEach(function (matchingProductDetail) {
                    expect(matchingProductDetail.category.name).to.equal(requestCategoryName);
                });

                return done(error);
            });
        });
    });
});