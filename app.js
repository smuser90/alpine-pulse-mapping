var ipAddress = '';

var mapData = function(data){
  socket.emit('map', data);
};

$.get("http://ipinfo.io", function(response) {
  ipAddress = response.ip;
  mapData(ipAddress);
}, "jsonp");
