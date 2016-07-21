var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var request = require('request');
var mongojs = require('mongojs');
var JSONStream = require('JSONStream');
var bodyParser = require('body-parser');

var db = mongojs('smuser:backhand@ds017544.mlab.com:17544/pulse-activity');

db.on('error', function(err){
  console.log('database error: ', err);

});

db.on('connect', function(){
  console.log('database connected');
});

var activity = db.collection('activity');

var Pulse = function Pulse(pulseData){
  return {
    time: Date.now(),
    latitude: pulseData.ll[0],
    longitude: pulseData.ll[1],
    radius: 2 + 1 * Math.random(),
    city: pulseData.city,
    region: pulseData.region,
    country: pulseData.country
  };
};

activity.find(function (err, docs){
  if(err)throw new Error(err);
  console.log('DOCS: ', docs);
});

app.use(express.static(__dirname + '/bower_components'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.get('/', function(req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

app.get(
  '/node_modules/datamaps/dist/datamaps.world.min.js',
  function(req, res, next){
    res.sendFile(__dirname + '/node_modules/datamaps/dist/datamaps.world.min.js');
  }
);

app.get('/client.js',
  function(req, res, next){
      res.sendFile(__dirname + '/client.js');
  }
);

app.post('/map', function(req, res){
  console.log("Rx'd a map request: "+req.body.ipAddress);
});

server.listen( process.env.PORT || 4200);

io.on('connection', function(client){
  var client_ip_address = client.request.connection.remoteAddress;
  console.log('Client connected.');
});

console.log("Server listening on port " + (process.env.PORT || 4200));
