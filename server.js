var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var request = require('request');
var mongojs = require('mongojs');
var JSONStream = require('JSONStream');
var bodyParser = require('body-parser');
var path = require('path');
var http = require('http');
var application_root = __dirname;

var Pulse = function Pulse(pulseData) {
    return {
        time: Date.now(),
        latitude: pulseData.lat,
        longitude: pulseData.lon,
        radius: 2 + 1 * Math.random(),
        city: pulseData.city,
        region: pulseData.region,
        country: pulseData.country
    };
};

var db = mongojs(process.env.DBUSER + ':' + process.env.DBPASS + '@ds017544.mlab.com:17544/pulse-activity');
var activity = db.collection('activity');
var analytics = db.collection('analytics');

var pulses = [];

db.on('error', function(err) {
    console.log('database error: ', err);

});

db.on('connect', function() {
    console.log('database connected');
});

app.use(express.static(__dirname + '/bower_components'));
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
app.use(express.static(path.join(application_root, "public")));

app.get('/', function(req, res, next) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/app', function(req, res, next) {
    res.sendFile(__dirname + '/app.html');
});
app.get(
    '/node_modules/datamaps/dist/datamaps.world.min.js',
    function(req, res, next) {
        res.sendFile(__dirname + '/node_modules/datamaps/dist/datamaps.world.min.js');
    }
);
app.get('/client.js',
    function(req, res, next) {
        res.sendFile(__dirname + '/client.js');
    }
);
app.get('/app.js',
    function(req, res, next) {
        res.sendFile(__dirname + '/app.js');
    }
);

var printJson = function printJson(obj) {
    for (var key in obj) {
        if (typeof(obj[key]) == 'object') {
            iter(obj[key]);
        } else {
            console.log(key + ": " + obj[key]);
        }
    }
};

app.post('/api/pulse-activity', function(req, res) {
    // res.header("Access-Control-Allow-Origin", "http://localhost");
    // res.header("Access-Control-Allow-Methods", "GET, POST");

    console.log("Rx'd a pulse activity post");
    printJson(req.body);

    analytics.findAndModify({
            query: {
                uuid: req.body.uuid
            }, // query
            update: {
                $set: req.body
            }, // replacement
            new: true
        }, // options
        function(err, object, lastErrorObject) {
            if (object == undefined) {
                console.warn('No matching object found. Making a new record.'); // returns error if no matching object found
                analytics.save(req.body,
                    function(err, saved) { // Query in MongoDB via Mongo JS Module
                        if (err || !saved) {
                            console.log('Activity not saved to db');
                        } else {
                            console.log('Activity saved to db');
                            analytics.find(function(err, docs) {
                                if (err) throw new Error(err);
                                console.log('DOCS: ', docs);
                            });
                        }
                    });
            } else {
                console.log("Found and updated the correct activity record");
                console.log(object);
                console.log(lastErrorObject);
            }
        });

    res.send(req.body);
});

app.post('/api/map', function(req, res) {
    // res.header("Access-Control-Allow-Origin", "http://localhost");
    // res.header("Access-Control-Allow-Methods", "GET, POST");

    console.log("Rx'd a map post");
    printJson(req.body);
    res.send(req.body);

    var options = {
        host: 'ip-api.com',
        port: 80,
        path: '/json/'+req.body.ipAddress,
        method: 'GET'
    };

    var geolocationRequest = http.request(options, function(res) {
        // console.log('STATUS: ' + res.statusCode);
        // console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            // console.log('Got a geo response! BODY: ' + chunk);
            var geoData = JSON.parse(chunk);
            pulses.push(new Pulse(geoData));
            console.log();
            console.log("Printing Pulses");
            console.dir(pulses);

            io.emit('pulse', JSON.stringify(pulses));
        });
    });

    geolocationRequest.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    // write data to request body
    geolocationRequest.write('data\n');
    geolocationRequest.write('data\n');
    geolocationRequest.end();

});

io.on('connection', function(client) {
    var client_ip_address = client.request.connection.remoteAddress;
    console.log('Client connected.');
});

server.listen(process.env.PORT || 4200);
console.log("Server listening on port " + (process.env.PORT || 4200));

analytics.find(function(err, docs) {
    if (err) throw new Error(err);
    console.log('DOCS: ', docs);
});
