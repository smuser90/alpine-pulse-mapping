var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var request = require('request');

app.use(express.static(__dirname + '/bower_components'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(4200);

console.log("Server listening on port 4200");

var locationLookup = function(ipAddress){

  request('http://freegeoip.net/json/'+ipAddress, function(error, response, body){
    if(!error && response.statusCode == 200){
      console.log(body);
    }
  });
};

io.on('connection', function(client){
  console.log('Client connected...');

  client.on('map', function(data){
    console.log(data);
    locationLookup(data);
  });
});
