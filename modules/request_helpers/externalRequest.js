'use strict';

var request = require('request');
var util = require('util');

var log4js = require('log4js');
var logger = log4js.getLogger('Module External Request');

var asJson = JSON.stringify;

function createUri(requestData) {
    var baseURL = "https://preprod.service-dk.norgesgruppen.no/";

    var isOauth = false;
    if (requestData.servicepath.toLowerCase().indexOf('oauth/') > -1) {
        isOauth = true;
    }

    if (requestData.environment === 'preproduction' || requestData.environment === 'local') {
        if (isOauth) {
            baseURL = "https://preprod.oauth.norgesgruppen.no/";
        } else {
            baseURL = "https://preprod.service-dk.norgesgruppen.no/";
        }
    } else if (requestData.environment === 'production') {
        if (isOauth) {
            baseURL = "https://oauth.norgesgruppen.no/";
        } else {
            baseURL = "https://service-dk.norgesgruppen.no/";
        }
    } else if (isOauth) {
        baseURL = "https://preprod.oauth.norgesgruppen.no/";
    }

    var servicepath = requestData.servicepath;
    if (servicepath && servicepath.length > 0 && servicepath[0] === '/') {
        servicepath = servicepath.substr(1);
    }

    return baseURL + servicepath;
}


var makeRequest = function (requestData, callback) {
    logger.debug('Resolving request');


    var responseObj = {
        serviceId: requestData.serviceId,
        response: {
            code: 0,
            origin: 'ngt',
            data: {}
        }
    };

    var headers = {};
    requestData.headers.forEach(function (header) {
        var h = Object.keys(header);
        headers[h[0]] = header[h[0]];
    });

    var options = {
        uri: createUri(requestData),
        headers: headers,
        timeout: 25000, // Timeout after 25 sec
        method: requestData.servicemethod || 'GET'
    };

    logger.debug('POSTing to: ' + options.uri);

    if (requestData.servicemethod === 'POST') {
        options.json = requestData.payload || "";
    }

    options.startTime = Date.now();

    request(options, function (error, response, body) {

        logger.trace('Resolved request for ' + options.uri);

        if (error) {
            logger.error('Got error on external request', asJson(error));
            if (error.code && error.code === "ETIMEDOUT") {
                responseObj.response.code = 408;
                responseObj.response.data = {message: "Request timeout"};
            } else {
                responseObj.response.code = 500;
                responseObj.response.data = {message: "Server not found"};
            }

            callback(responseObj);
            return;
        }

        try {
            logger.trace(util.format('Got response for %s with code %d (%d KB)', requestData.servicename, response.statusCode, Math.round(body.length / 1024)));

            responseObj.response.code = response.statusCode;

            if (typeof body === 'string') {
                try {
                    responseObj.response.data = JSON.parse(body);

                    if (requestData.servicename === 'storesGetStore') {
                        loggingInDespair(responseObj.response.data);
                    }

                } catch (err) {
                    responseObj.response.data = body;
                }
            } else {
                responseObj.response.data = body;
            }
        } catch (err) {
            logger.error('Caught error processing request', err);
            responseObj.response.code = 500;
            responseObj.response.data = {error: "Error processing response from NGT service"};
        }

        callback(responseObj);
    });
};

var _ = require('lodash');
var storeId = 7080001341596;
function loggingInDespair(stores) {
     var store = _.find(stores, function (store) {
        return store.id === storeId;
    });

    if(store) {
        logger.trace('Found store with id ' + storeId + ':\n', store);
    }

}

exports.makeRequest = makeRequest;
