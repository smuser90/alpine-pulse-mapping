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

var refreshMap = function() {
    console.log('map refresh');
    map.bubbles(pulses, {
        popupTemplate: function(geo, data) {
            return ['<div class="hoverinfo">',
                'City: ' + data.city,
                '</br>Time: ' + data.time,
                '</div>'
            ].join('');
        }
    });
};

var onConnect = function(data) {
    console.log("Connection approved: " + Date.now());
    connected = true;
};

var onPulse = function(data) {
    if (data) {
        pulses = JSON.parse(data);
        refreshMap();
    }
};

socket.on('connect', onConnect);

socket.on('pulse', onPulse);

var Get = function Get(yourUrl) {
    var Httpreq = new XMLHttpRequest(); // a new request
    Httpreq.open("GET", yourUrl, false);
    Httpreq.send(null);
    return Httpreq.responseText;
};

var post = function post(postURL, jsonData) {
    $.ajax({
        type: "POST",
        data: JSON.stringify(jsonData),
        url: postURL,
        contentType: "application/json"
    });
};

ipAddress = Get('http://api.ipify.org/?format=json');
console.log("Reporting IP Address to server: " + ipAddress);

post('/api/map', {
    ipAddress: JSON.parse(ipAddress).ip
});

post("api/pulse-activity", {
    uuid: 1982739781623,
    photos: 20,
    videos: 100,
    timelapses: 37,
    sessions: Math.floor(Math.random() * 101),
    uptime: 589
});
