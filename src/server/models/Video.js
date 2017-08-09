const mime = require("mime");
const ffprobe = require("node-ffprobe");

var methods = Video.prototype;

function Video(path) {
    this.path = path;
    var folders = path.split("/");
    this.filename = folders[folders.length-1];
    this.album = folders[folders.length-2];
    this.year = parseInt(folders[folders.length-3]);
    this.suspectTime = false;
}

function timestampFromFileName(filename) {
    if (filename.startsWith("VID_") && filename.length >= 17) {
        var year = filename.substring(4,8);
        var month = filename.substring(8,10);
        var day = filename.substring(10,12);

        if (month == "00")
            month = "01";
        if (day == "00")
            day = "01";

        var hour = "00";
        var minute = "00";
        var second = "00";

        if (filename.length >= 23) {
            hour = filename.substring(13,15);
            minute = filename.substring(15,17);
            second = filename.substring(17,19);
            // Some cameras have the same amount of digits in its iterator
            if (parseInt(hour) > 23 || parseInt(minute) > 60 || parseInt(second) > 60) {
                hour = "00";
                minute = "00";
                second = "00";
            }
        }

        return Math.floor(Date.parse(year + "-" + month + "-" + day + "T" + hour + ":" + minute + ":" + second + "Z") / 1000);
    }
    else {
        return false;
    }
}

methods.probe = function(callback) {
    var self = this;
    ffprobe(this.path, function(err, probeData) {
        self.probeData = probeData;
        callback(err);
    });
}

methods.hasValidExtension = function() {
    return mime.lookup(this.filename).startsWith("video/");
}

methods.getTimestamp = function(errorCallback) {
    var ts = timestampFromFileName(this.filename);
    if (ts) {
        return ts;
    }
    else {
        // Last resort, it must be at least the year :c
        errorCallback('w', "Unable to determine timestamp for " + this.path + " Using folder year as last resort.");
        this.suspectTime = true;
        return Math.floor(Date.parse(this.year) / 1000);
    }

    this.suspectTime = true;
    return 0;
}

methods.getLength = function() {
    return this.probeData.format.duration;
}

module.exports = Video;
