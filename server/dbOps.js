var mapDB,
persistenceDB,
analytics,
activity,
geoCache,
Pulse;

module.exports = {
    setupDBs: function(_mapDB, _persistenceDB, _Pulse){

      Pulse = _Pulse;
      mapDB = _mapDB;
      persistenceDB = _persistenceDB;
      analytics = persistenceDB.collection('analytics');
      geoCache = persistenceDB.collection('geo');
      activity = mapDB.collection('activity');

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
    },

    cacheActivity: function(pulses) {
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
    },

    loadActivity: function(pulses) {
      console.log("Loading activity from db");
      activity.find(function(err, docs){
        if(err || !docs){
          console.log("No activity pulled from db: "+err);
        }else{
          console.log("Activity succesfully loaded");
          var i = 0;
          for(i=0; i<docs.length; i++){
            pulses.push(new Pulse(docs[i]));
          }
        }
      });
    },

    checkGeoCache: function(ipAddress, callback) {
        geoCache.findOne({
            ip: ipAddress
        }, function(err, geoData) {
            if (err || !geoData) {
                grabGeoFromIP(ipAddress);
            } else {
                console.log("Found a cached geo record...");
                console.dir(geoData);
                var pulse = new Pulse(geoData);
                callback(pulse);
            }
        });
    },

    saveGeoData: function(geoData){
      console.log("Saving geo data to db");
      geoCache.save(geoData,
          function(err, saved) {
              if (err || !saved) {
                  console.log("Geo data not saved to db");
              } else {
                  console.log("Geo data saved to db");
              }
          });
    },

    cacheAnalytics: function(req){
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
          }
      );
    },

    refreshAggregates: function(aggregates) {
      console.log("Refreshing aggregates");
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
    }
};
