var LOCALHOST = 'http://localhost:1337/';
var PROD = 'https://service-dk.norgesgruppen.no/';
var PRE_PROD = 'https://preprod.service-dk.norgesgruppen.no/';
var AZURE_DEV = "https://ng-azure-rest-api-dev.azurewebsites.net/";
var AZURE_PRE_PROD = "https://ng-azure-rest-api-preprod.azurewebsites.net/";
var AZURE_PROD = "https://ng-azure-rest-api-prod.azurewebsites.net/";

var url = LOCALHOST;

var testConfig = {
    URL: url,
    timeout: {
        HALF_MINUTE: 30 * 1000
    },
    chainId: 1100,
    appOverrides: {
        port: 1337,
        disable: {
            'cache-warmup': 1,
            'product-module': 1
        },
        logging: {level: 'WARN'}
    },
    isLocal: function(){
        return url === LOCALHOST;
    }
};

module.exports = testConfig;