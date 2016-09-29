require('newrelic');
var sr = require('./server/serverRoutes');
var dbOps = require('./server/dbOps');
var http = require('http');
var server = http.createServer(sr.thisApp);
var io = require('socket.io')(server);

var mongojs = require('mongojs');
var JSONStream = require('JSONStream');

var Pulse = require('./server/structures').Pulse;
var SanitizedPulse = require('./server/structures').SanitizedPulse;

var mapDB = mongojs(process.env.DBUSER + ':' + process.env.DBPASS + '@ds017544.mlab.com:17544/pulse-activity');
var persistenceDB = mongojs(process.env.DBUSER + ':' + process.env.DBPASS + '@ds013166-a0.mlab.com:13166,ds013166-a1.mlab.com:13166/pulse-analytics?replicaSet=rs-ds013166');

var aggregates = {};
var pulses = []; // Full data objects for internal use
var sp = []; // Sanitized data for public display
var openSockets = 0;

var SOCKET_LIMIT = 6000;
var HRS = 12;
var MINS = 60;
var SECS = 60;
var MPS = 1000;

// Only live for 12 hours
var cullTime = HRS * MINS * SECS * MPS;

io.on('connection', function(client) {
  var sanitizedPulses = sanitizePulses();
  client.emit('pulse', JSON.stringify(sanitizedPulses));

  if(openSockets < SOCKET_LIMIT){
    openSockets++;
    client.on('disconnect', function(){
      openSockets--;
    });
  }else{
    client.disconnect();
  }
});

var isNewIP = function(ip) {
    var isNew = true;
    var i = 0;
    for (i; i < pulses.length; i++) {
        if (pulses[i].ip == ip) {
            isNew = false;
            break;
        }
    }
    return isNew;
};

var updateTimestamp = function(ip) {
    var i = 0;
    for (i; i < pulses.length; i++) {
        if (pulses[i].ip == ip) {
            pulses[i].time = Date.now();
            break;
        }
    }
};

var grabGeoFromIP = function(ip) {
    console.log("Grabbing geo from url: http://ip-api.com/json/" + ip);

    var options = {
        host: 'freegeoip.net',
        port: 80,
        path: '/json/' + ip,
        method: 'GET'
    };

    var geolocationRequest = http.request(options, function(res) {
        // console.log('STATUS: ' + res.statusCode);
        // console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            // console.log('Got a geo response! BODY: ' + chunk);

            var geoData = JSON.parse(chunk);
            dbOps.saveGeoData(geoData);

            var pulse = new Pulse(geoData);
            updatePulseList(pulse);
        });
    });

    geolocationRequest.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });

    // write data to request body
    geolocationRequest.write('data\n');
    geolocationRequest.write('data\n');
    geolocationRequest.end();
};

var updatePulseList = function(pulse) {
    var i = 0;
    var found = false;
    for (i; i < pulses.length; i++) {
        if (pulses[i].ip == pulse.ip) {
            found = true;
            // We found an existing pulse. Just update its activity time.
            pulses[i].time = pulse.time;
        }
    }

    if (!found) {
        pulses.push(pulse);
        dbOps.cacheActivity(pulses);
    }
    console.log();
    console.log("Pulse List Updated...");
    console.dir(pulses);

    var sanitizedPulses = sanitizePulses();
    io.emit('pulse', JSON.stringify(sanitizedPulses));
};

var sanitizePulses = function() {
    var i = 0;
    sp = [];
    for (i; i < pulses.length; i++) {
        sp.push(new SanitizedPulse(pulses[i]));
    }

    return sp;
};

var cullPulses = function() {
    var i = 0;
    var change = false;
    for (i; i < pulses.length; i++) {
        if (pulses[i].time < (Date.now() - cullTime)) {
            pulses.splice(i, 1);
            change = true;
        }
    }

    if (change) {
        dbOps.cacheActivity();
        var sanitizedPulses = sanitizePulses();
        io.emit('pulse', JSON.stringify(sanitizedPulses));
    }
};

var serverTick = function() {
    cullPulses();
    dbOps.refreshAggregates(aggregates);
};

var run = function() {

    server.listen(process.env.PORT || 4200);
    console.log("Server listening on port " + (process.env.PORT || 4200));

    dbOps.loadActivity(pulses);
    dbOps.refreshAggregates(aggregates);

    // Every 30 seconds lets tick
    setInterval(serverTick, 30000);
};

dbOps.setupDBs(mapDB, persistenceDB, Pulse, grabGeoFromIP);

sr.setupRoutes(dbOps.cacheAnalytics, isNewIP, dbOps.checkGeoCache,
              updateTimestamp, updatePulseList, aggregates);

run();
