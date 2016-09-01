
var sr = require('./server/serverRoutes');
var http = require('http');
var server = http.createServer(sr.thisApp);
var io = require('socket.io')(server);

var mongojs = require('mongojs');
var JSONStream = require('JSONStream');

var aggregates = {};
var pulses = []; // Full data objects for internal use
var sp = []; // Sanitized data for public display
var openSockets = 0;

var SOCKET_LIMIT = 6000;
var MPS = 1000;
var HRS = 12;
var MINS = 60;
var SECS = 60;

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

var mapDB = mongojs(process.env.DBUSER + ':' + process.env.DBPASS + '@ds017544.mlab.com:17544/pulse-activity');
var persistenceDB = mongojs(process.env.DBUSER + ':' + process.env.DBPASS + '@ds013166-a0.mlab.com:13166,ds013166-a1.mlab.com:13166/pulse-analytics?replicaSet=rs-ds013166');
var analytics = persistenceDB.collection('analytics');
var activity = mapDB.collection('activity');
var geoCache = persistenceDB.collection('geo');

mapDB.on('error', function(err) {
    console.log('mapping database error: ', err);
});

mapDB.on('connect', function() {
    console.log('mapping database connected');
});

persistenceDB.on('error', function(err) {
    console.log('activity database error: ', err);
});

persistenceDB.on('connect', function() {
    console.log('activity database connected');
});

var Pulse = function Pulse(geoData) {
    return {
        time: Date.now(),
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        radius: 2 + 1 * Math.random(),
        city: geoData.city,
        region: geoData.region_code,
        country: geoData.country_name,
        ip: geoData.ip
    };
};

var SanitizedPulse = function SanitizedPulse(pulse) {
    return {
        time: pulse.time,
        latitude: pulse.latitude,
        longitude: pulse.longitude,
        radius: pulse.radius,
        region: pulse.region,
        country: pulse.country
    };
};

var printJson = function printJson(obj) {
    for (var key in obj) {
        if (typeof(obj[key]) == 'object') {
            iter(obj[key]);
        } else {
            console.log(key + ": " + obj[key]);
        }
    }
};

var cacheActivity = function() {
    console.log("Caching Activity to MongoDB");
    activity.remove({}, function(err, status) {
        if (pulses.length > 0) {
            activity.save(pulses,
                function(err, saved) { // Query in MongoDB via Mongo JS Module
                    if (err || !saved) {
                        console.log('Activity not saved to db');
                    } else {
                        console.log('Activity saved to db');
                    }
                });
        }
    });
};

var cacheAnalytics = function(req) {
    console.log("Caching Analytics to MongoDB");
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
                            console.log('Analytics not saved to db');
                        } else {
                            console.log('Analytics saved to db');
                        }
                    });
            } else {
                console.log("Found and updated the correct analytics record");
                console.log(object);
                console.log(lastErrorObject);
            }
        });
};

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

var checkGeoCache = function(ipAddress) {
    geoCache.findOne({
        ip: ipAddress
    }, function(err, geoData) {
        if (err || !geoData) {
            grabGeoFromIP(ipAddress);
        } else {
            console.log("Found a cached geo record...");
            console.dir(geoData);
            var pulse = new Pulse(geoData);
            updatePulseList(pulse);
        }
    });
};

var saveGeoData = function(geoData) {
    console.log("Saving geo data to db");
    geoCache.save(geoData,
        function(err, saved) {
            if (err || !saved) {
                console.log("Geo data not saved to db");
            } else {
                console.log("Geo data saved to db");
            }
        });
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
            saveGeoData(geoData);

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
        cacheActivity();
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
        cacheActivity();
        var sanitizedPulses = sanitizePulses();
        io.emit('pulse', JSON.stringify(sanitizedPulses));
    }
};

var refreshAggregates = function() {
    analytics.aggregate([{
            $group: {
                _id: null,
                photos: {
                    $sum: "$photos"
                }
            }
        }], {}, // no options
        function(err, data) {
            aggregates.photos = data[0].photos;
        }
    );

    analytics.aggregate([{
            $group: {
                _id: null,
                videos: {
                    $sum: "$videos"
                }
            }
        }], {}, // no options
        function(err, data) {
            aggregates.videos = data[0].videos;
        }
    );

    analytics.aggregate([{
            $group: {
                _id: null,
                timelapses: {
                    $sum: "$timelapses"
                }
            }
        }], {}, // no options
        function(err, data) {
            aggregates.timelapses = data[0].timelapses;
        }
    );

    analytics.aggregate([{
            $group: {
                _id: null,
                sessions: {
                    $sum: "$sessions"
                }
            }
        }], {}, // no options
        function(err, data) {
            aggregates.sessions = data[0].sessions;
        }
    );

    analytics.aggregate([{
            $group: {
                _id: null,
                uptime: {
                    $sum: "$uptime"
                }
            }
        }], {}, // no options
        function(err, data) {
            aggregates.uptime = data[0].uptime;
        }
    );

    analytics.aggregate([{
            $group: {
                _id: null,
                thumbnails: {
                    $sum: "$thumbnails"
                }
            }
        }], {}, // no options
        function(err, data) {
            aggregates.thumbnails = data[0].thumbnails;
        }
    );
};

var serverTick = function() {
    cullPulses();
    refreshAggregates();
};

var run = function() {

    server.listen(process.env.PORT || 4200);
    console.log("Server listening on port " + (process.env.PORT || 4200));

    analytics.find(function(err, docs) {
        if (err) throw new Error(err);
        console.log('ANALYTICS DOCS: ', docs);
    });

    activity.find(function(err, docs) {
        if (err) throw new Error(err);
        console.log('MAPPING DOCS: ', docs);
        pulses = docs;
    });

    geoCache.find(function(err, docs) {
        if (err) throw new Error(err);
        console.log('GEO DOCS: ', docs);
    });

    refreshAggregates();

    // Every 30 seconds lets tick
    setInterval(serverTick, 30000);
};

sr.setupRoutes(cacheAnalytics, isNewIP, checkGeoCache,
              updateTimestamp, aggregates);

run();
