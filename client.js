var pulses = [];
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

var ipAddress = '';
var connected = false;
var socket = io.connect(
  'https://pulse-mapper.herokuapp.com:' + (location.port || '443')
  // 'http://localhost:4200'
);

var map = new Datamap({
  element: document.getElementById('mapContainer'),
  fills: {
    defaultFill: 'rgba(0,120,202,1)',
    bubbles: 'rgba(20,120,220,0.7)'
  },
  geographyConfig: {
    highlightOnHover: false,
    popupOnHover: false
  },
  bubblesConfig: {
    fillOpacity: 0.7,
    fillColor: 'rgba(20,120,220,0.7)'
  }
});

var Get = function Get(yourUrl){
  var Httpreq = new XMLHttpRequest(); // a new request
  Httpreq.open("GET",yourUrl,false);
  Httpreq.send(null);
  return Httpreq.responseText;
};

function _ajax_request(url, data, callback, method) {
    return jQuery.ajax({
        url: url,
        type: method,
        data: data,
        success: callback
    });
}

jQuery.extend({
    put: function(url, data, callback) {
        return _ajax_request(url, data, callback, 'PUT');
}});

var refreshMap = function(){
  console.log('map refresh');
  map.bubbles(pulses, {
    popupTemplate: function(geo, data){
      return [ '<div class="hoverinfo">',
                'City: ' + data.city,
                '</br>Time: ' + data.time,
              '</div>'].join('');
    }
  });
};

var onConnect = function(data){
  console.log("Connection approved: "+ Date.now());
  connected = true;
};

var onPulse = function(data){
  if(data){
    pulses.push(new Pulse(data));
    refreshMap();
  }
};

socket.on('connect', onConnect);

socket.on('pulse', onPulse);

console.log("Reporting IP Address to server: "+ipAddress);
$.put('/map', {}, function(result) {
    console.log(result);
});
