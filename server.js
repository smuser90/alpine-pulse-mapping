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

io.on('connection', function(client){
  var client_ip_address = io.request.connection.remoteAddress;
  console.log('Client connected... ['+client_ip_address+']');

  client.on('map', function(data){
    console.log('Received data from client: ' + data);
    io.emit('pulse', data);
  });
});

console.log("Server listening on port " + (process.env.PORT || 4200));
