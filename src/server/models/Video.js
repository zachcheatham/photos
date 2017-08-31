const mime = require("mime");
const ffprobe = require("node-ffprobe");
const fs = require("fs");

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

methods.getWidth = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "video") {
                return this.probeData.streams[i].width;
            }
        }
    }
    return null;
}

methods.getHeight = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "video") {
                return this.probeData.streams[i].height;
            }
        }
    }
    return null;
}

methods.getLength = function() {
    return this.probeData.format.duration;
}

methods.getFilesize = function() {
    if (this.probeData && this.probeData.format) {
        return this.probeData.format.size;
    }
    else {
        const stat = fs.statSync(this.path);
        return stat["size"];
    }
}

methods.getFormat = function() {
    if (this.probeData && this.probeData.format) {
        return this.probeData.format.format_name;
    }
    return null;
}

methods.getVideoCodec = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "video") {
                return this.probeData.streams[i].codec_name
            }
        }
    }
    return null;
}

methods.getPixelFormat = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "video") {
                return this.probeData.streams[i].pix_fmt
            }
        }
    }
    return null;
}

methods.getPixelFormat = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "video") {
                return this.probeData.streams[i].pix_fmt
            }
        }
    }
    return null;
}

methods.getFramerate = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "video") {
                const frac = this.probeData.streams[i].r_frame_rate.split("/");
                if (frac.length == 2) {
                    const n = parseInt(frac[0]);
                    const d = parseInt(frac[1]);

                    return Math.round(n/d * 100) / 100;
                }
                else {
                    return null;
                }
            }
        }
    }
    return null;
}

methods.getScanningMethod = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "video") {
                if (this.probeData.streams[i].field_order == "unknown") {
                    return 'P';
                }
                else {
                    return 'I';
                }
            }
        }
    }
    return null;
}

methods.getAudioCodec = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "audio") {
                return this.probeData.streams[i].codec_name;
            }
        }
    }
    return null;
}

methods.getAudioChannels = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "audio") {
                return this.probeData.streams[i].channels;
            }
        }
    }
    return null;
}

methods.getAudioChannels = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "audio") {
                return this.probeData.streams[i].channels;
            }
        }
    }
    return null;
}

methods.getAudioChannelLayout = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "audio") {
                return this.probeData.streams[i].channel_layout;
            }
        }
    }
    return null;
}

methods.getAudioSampleRate = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "audio") {
                return this.probeData.streams[i].sample_rate;
            }
        }
    }
    return null;
}

methods.getAudioBitrate = function() {
    if (this.probeData && this.probeData.streams) {
        for (var i = 0; i < this.probeData.streams.length; i++) {
            if (this.probeData.streams[i].codec_type == "audio") {
                return this.probeData.streams[i].bit_rate;
            }
        }
    }
    return null;
}


module.exports = Video;
