const fs = require("fs");
const mime = require("mime");
const ExifImage = require("exif").ExifImage

var methods = Photo.prototype;

function Photo(path) {
    this.path = path;
    var folders = path.split("/");
    this.filename = folders[folders.length-1];
    this.album = folders[folders.length-2];
    this.year = parseInt(folders[folders.length-3]);
    this.suspectTime = false;
}

methods.getFilesize = function() {
    const stat = fs.statSync(this.path);
    return stat["size"];
}

methods.hasValidExtension = function() {
    return mime.lookup(this.filename).startsWith("image/");
}

methods.readExif = function(callback) {
    var self = this;
    new ExifImage({image: this.path}, function(error, exifData) {
        self.exifData = exifData;
        callback(error);
    });
}

function timestampFromFileName(filename) {
    if (filename.startsWith("IMG_") && filename.length >= 17) {
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

methods.getTimestamp = function(errorCallback, useExif=true) {
    if (this.exifData && useExif) {
        var timestring = null;

        if (this.exifData.exif.DateTimeOriginal) {
            timestring = this.exifData.exif.DateTimeOriginal;
        }
        else if (this.exifData.image.ModifyDate) {
            timestring = this.exifData.image.ModifyDate;
        }

        if (timestring != null) {
            var timeparts = timestring.split(" ");

            if (parseInt(timeparts[0].substring(0,4)) != this.year) {
                this.suspectTime = true;
                return this.getTimestamp(errorCallback, false);
            }

            timestring = timeparts[0].replace(/:/g, "-");
            timestring += "T";
            timestring += timeparts[1];
            timestring += "Z";

            return Math.floor(Date.parse(timestring) / 1000);
        }
    }
    else {
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
    }

    this.suspectTime = true;
    return 0;
}

methods.getRotation = function() {
    if (this.exifData && this.exifData.image.Orientation) {
        switch (this.exifData.image.Orientation) {
            case 1:
                return 0;
            case 6:
                return 90;
            case 3:
                return 180;
            case 8:
                return 270;
        }
    }

    return 0;
}

methods.getMake = function() {
    if (
        this.exifData &&
        this.exifData.image &&
        this.exifData.image.Make
    ) {
        return this.exifData.image.Make;
    }
    else {
        return null;
    }
}

methods.getModel = function() {
    if (
        this.exifData &&
        this.exifData.image &&
        this.exifData.image.Model
    ) {
        return this.exifData.image.Model;
    }
    else {
        return null;
    }
}

methods.getLensModel = function() {
    if (
        this.exifData &&
        this.exifData.exif &&
        this.exifData.exif.LensModel
    ) {
        return this.exifData.exif.LensModel
    }
    else {
        return null;
    }
}

methods.getFNumber = function() {
    if (
        this.exifData &&
        this.exifData.exif &&
        this.exifData.exif.FNumber
    ) {
        return this.exifData.exif.FNumber
    }
    else {
        return null;
    }
}

methods.getExposureTime = function() {
    if (
        this.exifData &&
        this.exifData.exif &&
        this.exifData.exif.ExposureTime
    ) {
        return this.exifData.exif.ExposureTime
    }
    else {
        return null;
    }
}

methods.getFocalLength = function() {
    if (
        this.exifData &&
        this.exifData.exif &&
        this.exifData.exif.FocalLength
    ) {
        return this.exifData.exif.FocalLength
    }
    else {
        return null;
    }
}

methods.getISO = function() {
    if (
        this.exifData &&
        this.exifData.exif &&
        this.exifData.exif.ISO
    ) {
        return this.exifData.exif.ISO
    }
    else {
        return null;
    }
}

methods.getGPSLatitude = function() {
    if (
        this.exifData &&
        this.exifData.gps &&
        this.exifData.gps.GPSLatitude
    ) {
        var direction = 0;
        if (this.exifData.gps.GPSLatitudeRef == 'N') {
            direction = 1;
        }
        else if (this.exifData.gps.GPSLatitudeRef == 'S') {
            direction = -1;
        }

        return (
            (
                this.exifData.gps.GPSLatitude[0] +
                this.exifData.gps.GPSLatitude[1] / 60 +
                this.exifData.gps.GPSLatitude[2] / 3600
            ) *
            direction
        );
    }
    else {
        return null;
    }
}

methods.getGPSLongitude = function() {
    if (
        this.exifData &&
        this.exifData.gps &&
        this.exifData.gps.GPSLongitude
    ) {
        var direction = 0;
        if (this.exifData.gps.GPSLongitudeRef == 'E') {
            direction = 1;
        }
        else if (this.exifData.gps.GPSLongitudeRef == 'W') {
            direction = -1;
        }

        return (
            (
                this.exifData.gps.GPSLongitude[0] +
                this.exifData.gps.GPSLongitude[1] / 60 +
                this.exifData.gps.GPSLongitude[2] / 3600
            ) *
            direction
        );
    }
    else {
        return null;
    }
}

methods.getGPSDirection = function() {
    if (
        this.exifData &&
        this.exifData.gps &&
        this.exifData.gps.GPSImgDirection
    ) {
        return this.exifData.gps.GPSImgDirection;
    }
}

methods.getWidth = function() {
    if (
        this.exifData &&
        this.exifData.exif &&
        this.exifData.exif.ExifImageWidth
    ) {
        return this.exifData.exif.ExifImageWidth;
    }
    else {
        return 0;
    }
}

methods.getHeight = function() {
    if (
        this.exifData &&
        this.exifData.exif &&
        this.exifData.exif.ExifImageHeight
    ) {
        return this.exifData.exif.ExifImageHeight;
    }
    else {
        return 0;
    }
}

module.exports = Photo;
