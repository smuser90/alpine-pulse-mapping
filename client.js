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
function makeCorsRequest() {
  // All HTML5 Rocks properties support CORS.
  var url = "http://ipinfo.io/json";

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

var pulses = [];
var Pulse = function Pulse(pd){
  console.log('pulse activity data: '+pd);
  var pulseData = JSON.parse(pd);
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
}

var onPulse = function(data){
  pulses.push(new Pulse(data));
  refreshMap();
}

socket.on('connect', onConnect);

socket.on('pulse', onPulse)

var getIP = function(){
  console.log("Retreiving IP Address...");

  makeCorsRequest();
};

setInterval(getIP, 5000 * Math.random());
