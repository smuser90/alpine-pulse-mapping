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
                data.region + ', ' + data.country,
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
        console.log('Received pulse activity data');
        pulses = [];
        refreshMap();
        setTimeout(function() {
            pulses = JSON.parse(data);
            console.dir(pulses);
            refreshMap();
        }, 200);
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

post('/api/pulse-map', {
    ipAddress: JSON.parse(ipAddress).ip
});

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
