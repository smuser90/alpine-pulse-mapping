var express = require('express');
var path = require('path');
var application_root = __dirname;
var app = express();
var http = require('http');
var cors = require('cors');
var bodyParser = require('body-parser');

module.exports = {
  thisApp: app,
  setupRoutes: function(cacheAnalytics, isNewIP, checkGeoCache,
                        updateTimestamp, aggregates){
    app.use(cors());

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

    app.get('/api/photos',
        function(req, res, next) {
            res.json({
                photos: aggregates.photos
            });
        }
    );

    app.get('/api/videos',
        function(req, res, next) {
            res.json({
                videos: aggregates.videos
            });
        }
    );

    app.get('/api/timelapses',
        function(req, res, next) {
            res.json({
                timelapses: aggregates.timelapses
            });
        }
    );

    app.get('/api/sessions',
        function(req, res, next) {
            res.json({
                sessions: aggregates.sessions
            });
        }
    );

    app.get('/api/uptime',
        function(req, res, next) {
            res.json({
                uptime: aggregates.uptime
            });
        }
    );

    app.get('/api/thumbnails',
        function(req, res, next) {
            res.json({
                thumbnails: aggregates.thumbnails
            });
        }
    );

    app.get('/api/connections',
        function(req, res, next) {
            res.json({
                connections: openSockets
            });
        }
    );

    app.post('/api/pulse-analytics', function(req, res) {
        console.log("Rx'd a pulse analytics post");
        res.send(req.body);

        cacheAnalytics(req);
    });

    app.post('/api/pulse-map', function(req, res) {
        console.log("Rx'd a map post: ", req.body.ipAddress);
        printJson(req.body);
        res.send(req.body);

        if (isNewIP(req.body.ipAddress)) {
            checkGeoCache(req.body.ipAddress);
        } else {
            updateTimestamp(req.body.ipAddress);
        }
    });
  }
};
