var ipAddress = '';

var mapData = function(data) {
    socket.emit('map', data);
};

$.get("http://ipinfo.io", function(response) {
    ipAddress = response.ip;
    // mapData(ipAddress);
}, "jsonp");

var post = function post(postURL, jsonData) {
    $.ajax({
        type: "POST",
        data: JSON.stringify(jsonData),
        url: postURL,
        contentType: "application/json"
    });
};

post("api/pulse-activity", {
    uuid: 1982739781623,
    photos: 20,
    videos: 100,
    timelapses: 37,
    sessions: Math.floor(Math.random() * 101),
    uptime: 589
});
