module.exports = {
  Pulse: function Pulse(geoData){
    return {
        time: Date.now(),
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        radius: 2 + 1 * Math.random(),
        city: geoData.city,
        region: geoData.region_code ? geoData.region_code : geoData.region,
        country: geoData.country_name ? geoData.country_name : geoData.country,
        ip: geoData.ip
    };
  },

  SanitizedPulse: function SanitizedPulse(pulse){
    return {
        time: pulse.time,
        latitude: pulse.latitude,
        longitude: pulse.longitude,
        radius: pulse.radius,
        region: pulse.region,
        country: pulse.country
    };
  }
};
