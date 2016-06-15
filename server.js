var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var request = require('request');

app.use(express.static(__dirname + '/bower_components'));

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

server.listen( process.env.PORT || 4200);

var locationLookup = function(ipAddress){

  request('http://freegeoip.net/json/'+ipAddress, function(error, response, body){
    if(!error && response.statusCode == 200){
      var geoData = JSON.parse(body);
      console.log(geoData);
    }else{
      console.log("ERROR: "+error+"\nStatus Code: "+response.statusCode);
    }
  });
};

var getIP = function(){
  console.log("Retreiving IP Address...");
  request("http://ip-api.com/json", function(error, response, body) {
    io.emit('pulse', response.body);
  });
};

io.on('connection', function(client){
  console.log('Client connected...');

  client.on('map', function(data){
    console.log('Received data from client: '+data);
    io.emit('pulse', data);
  });
});

console.log("Server listening on port " + (process.env.PORT || 4200));
// setInterval(getIP, 5000 * Math.random() + 1);
