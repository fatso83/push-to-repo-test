var express = require('express');
var request = require('request');

var geo = require('./_geo');

var app = express();

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    next();
});

app.use(function(req, res, next) {
  for (var key in req.query)
  { 
    req.query[key.toLowerCase()] = req.query[key];
  }
  next();
});

// HELLO WORLD
app.get('/', function(req, res) {
  res.type('text/plain');
  res.send('skynet is aware');
});


app.get('/dist/', function(req, res){
    res.type('application/json');
    res.send(geo.getClosestStores(req.query.latitude, req.query.longitude, req.query.minnumberofstores, req.query.maxnumberofstores, req.query.maxdistance));
});

app.get('*', function(req, res){
  res.send('nobody\'s home', 404);
});

app.listen(process.env.PORT || 1337);

