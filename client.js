var pulses = [];
var Pulse = function Pulse(pd){
  console.log('pulse activity data: '+pd);
  var pulseData = JSON.parse(pd);
  return {
    time: Date.now(),
    latitude: pulseData.lat,
    longitude: pulseData.lon,
    radius: 20 * Math.random(),
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

var refreshMap = function(){
  console.log('map refresh');
  if(pulses.length > 200){
    pulses = pulses.splice(0, Math.ceil(pulses.length / 2));
  }
  map.bubbles(pulses, {
    popupTemplate: function(geo, data){
      return [ '<div class="hoverinfo">',
                'City: ' + data.city,
                '</br>Time: ' + data.time,
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
};

var onPulse = function(data){
  pulses.push(new Pulse(data));
  refreshMap();
};

socket.on('connect', onConnect);

socket.on('pulse', onPulse);

var getIP = function(){
  console.log("Retreiving IP Address...");

  makeCorsRequest("http://ip-api.com/json");
};

// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

// Make the actual CORS request.
function makeCorsRequest(url) {
  // All HTML5 Rocks properties support CORS.
  var xhr = createCORSRequest('GET', url);
  if (!xhr) {
    alert('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    var text = xhr.responseText;
    mapData(text);
  };

  xhr.onerror = function() {
    alert('Woops, there was an error making the request.');
  };

  xhr.send();
}
