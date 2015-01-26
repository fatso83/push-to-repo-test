var LOCALHOST = 'http://localhost:1337/';
var PROD = 'https://service-dk.norgesgruppen.no/';
var PRE_PROD = 'https://preprod.service-dk.norgesgruppen.no/';

module.exports = {
    URL: LOCALHOST,
    timeout: {
        HALF_MINUTE: 30 * 1000
    },
    chainId: 1100
};