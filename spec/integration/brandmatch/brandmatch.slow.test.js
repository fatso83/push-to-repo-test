var expect = require('chai').expect;
var request = require('request');
var app = require('../../../app');
var utils = require('../../../modules/utils');

// This test assumes there are First Price products which are of category "Drikkevarer".

describe('slow.brandmatch service', function () {

    this.timeout(6000);

    var mock = {
        URL: 'http://localhost:1337/api/uidata/brandmatch/1100',
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
        app.start({
            port: 1337,
            disable: {
                'cache-warmup': 1,
                'product-module': 1
            },
            logging: {level: 'WARN'}
        }, done);
    });

    after(function (done) {
        app.stop(done);
    });

    describe('/uidata/brandmatch/', function () {
        it('should return all brandmatches for chainId 1100 with given example', function (done) {

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