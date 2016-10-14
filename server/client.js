var pulses = [];
var ipAddress = '';
var connected = false;

var hq = {
    lat: 40.015,
    long:-105.270
};

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
        popupOnHover: false,
        borderWidth: 0
    },
    bubblesConfig: {
        fillOpacity: 0.7,
        fillColor: 'rgba(20,120,220,0.7)',
        borderWidth: 1,
        borderColor: '#FF7F50'
    },
    arcConfig: {
      strokeColor: '#DD1C77',
      strokeWidth: 1,
      arcSharpness: 1,
      animationSpeed: 600, // Milliseconds
      popupOnHover: false
    },
    projection: 'mercator'
});

var hqToClientArcList = function(endpoints){
  var list = [];
    for(var i = 0; i < endpoints.length; i++){
      list.push({
        origin: {
          latitude: hq.lat,
          longitude: hq.long
        },
        destination: {
          latitude: endpoints[i].latitude,
          longitude: endpoints[i].longitude
        }
      });
    }
  // console.dir(list);
  return list;
};

var refreshMap = function() {
    console.log('map refresh');
    map.bubbles(pulses, {
        popupTemplate: function(geo, data) {
            return ['<div class="hoverinfo">',
                data.city + ', ' + data.country,
                '</div>'
            ].join('');
        }
    });

    map.arc( hqToClientArcList(pulses));
};

var onConnect = function(data) {
    console.log("Connection approved: " + Date.now());
    connected = true;
};

var onPulse = function(data) {
    if (data) {
        console.log(new Date().toUTCString()+': Received pulse activity data');
        pulses = [];
        refreshMap();
        setTimeout(function() {
            pulses = JSON.parse(data);
            // console.dir(pulses);
            refreshMap();
        }, 200);
    }
};

socket.on('connect', onConnect);

socket.on('pulse', onPulse);

$(document).ready(function(){

});

// post('/api/pulse-map', {
//     ipAddress: JSON.parse(ipAddress).ip
// });

// setTimeout(function() {
//     post("api/pulse-analytics", {
//         uuid: 1982739781623,
//         photos: 20,
//         videos: 100,
//         timelapses: 37,
//         sessions: Math.floor(Math.random() * 101),
//         uptime: 589
//     });
// }, 5000);
