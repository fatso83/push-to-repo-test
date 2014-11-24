var express = require('express');
var request = require('request');
var quotes = require('./_quotes.js');
var tablestorage = require('./tablestorage.js');
var uuid = require('node-uuid');
var geo = require('./_geo');

var app = express();

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    next();
});

// HELLO WORLD
app.get('/', function(req, res) {
  res.type('text/plain');
  res.send('skynet is aware');
});

var source = 'http://ip.jsontest.com/';
app.get('/ip', function(req, res) { req.pipe(request(source)).pipe(res) })



// storage
app.get('/table/store', function(req, res){
  res.type('text/plain');

  var item = new Object();
  item.Value = "embedded";
  item.RowKey = uuid();
  item.PartitionKey = 'prpartition';

  var table = tablestorage.Write('prnode', item, function(result){
    
      res.send(result);
    
  });
});

// QUOTES

app.get('/quotes', function(req, res){
    res.type('application/json');
    res.send(quotes.list());  
});

app.get('/quotes/random', function(req, res){
    res.type('application/json');
    res.send(quotes.random());
});


app.get('/dist/', function(req, res){
    res.type('application/json');
    res.send(geo.closest(req.query.latitude, req.query.longitude, req.query.minNumberOfStores, req.query.maxNumberOfStores, req.query.maxDistance));
});



app.get('*', function(req, res){
  res.send('nobody\'s home', 404);
});

app.listen(process.env.PORT || 1337);

