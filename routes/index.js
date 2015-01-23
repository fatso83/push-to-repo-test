
/*
 * GET home page.
 */

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    res.json(
        {
            data : "running"
        }
    );

});

module.exports = router;