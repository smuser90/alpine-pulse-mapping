var pulses = [];
var ipAddress = '';
var connected = false;
var socket = io.connect(
  // 'https://pulse-mapper.herokuapp.com:' + (location.port || '443')
  'http://localhost:4200'
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

function post(path, params, method) {
    method = method || "post"; // Set method to post by default if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    document.body.appendChild(form);
    form.submit();
}

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
    pulses = JSON.parse(data);
    refreshMap();
  }
};

socket.on('connect', onConnect);

socket.on('pulse', onPulse);

ipAddress = Get('http://api.ipify.org/?format=json');
console.log("Reporting IP Address to server: "+ipAddress);

post('/map', {ipAddress: JSON.parse(ipAddress).ip});
