
/*
 * GET home page.
 */

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('loaderio-c3741ebb643657e965b349ec5d11ab7e', 'utf-8');

});

module.exports = router;