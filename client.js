var pulses = [];
var Pulse = function Pulse(pd){
  console.log('pulse activity data: '+pd);
  var pulseData = pd; //JSON.parse(pd);
  return {
    time: Date.now(),
    latitude: pulseData.loc.split(',')[0],
    longitude: pulseData.loc.split(',')[1],
    radius: 40,
    city: pulseData.city
  };
};

var ipAddress = '';
var connected = false;
var socket = io.connect(
  'https://pulse-mapper.herokuapp.com:' + (location.port || '443')
  // 'http://localhost:4200'
);

var map = new Datamap({
  element: document.getElementById('mapContainer'),
  fills: {
    defaultFill: 'rgba(0,120,220,1)'
  },
  geographyConfig: {
    highlightOnHover: false,
    popupOnHover: false
  }
});

var refreshMap = function(){
  console.log('map refresh');
  map.bubbles(pulses, {
    popupTemplate: function(geo, data){
      return [ '<div class="hoverinfo">',
                'City: ' + data.city,
                'Time: ' + data.time,
              '</div>'].join('');
    }
  });
};

var mapData = function(data){
  socket.emit('map', data);
};

var onConnect = function(data){
  console.log("Connection approved: "+ Date.now());
  connected = true;
}

var onPulse = function(data){
  pulses.push(new Pulse(data));
  refreshMap();
}

socket.on('connect', onConnect);

socket.on('pulse', onPulse)

$.get("http://ipinfo.io/json", function(response) {

  if(connected){
    console.log(response);
    mapData(response);
  }
}, "jsonp");
