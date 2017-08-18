const THUMBNAIL_SIZE = 180 * 2;
const THUMBNAIL_CACHE_PATH = "./content/thumbnails/"

const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

var methods = {}

methods.getPhotoThumbnail = function(filePath, callback) {
    const pathInfo = path.parse(filePath);
    const thumbnailPath = THUMBNAIL_CACHE_PATH + pathInfo.name + ".png"
    if (fs.existsSync(thumbnailPath)) {
        callback(fs.readFileSync(thumbnailPath));
    }
    else {
        var img = sharp(filePath);
        img.metadata().then(function(metadata) {
            var resizeWidth = 0;
            var resizeHeight = 0;

            if (metadata.width > metadata.height) {
                resizeHeight = THUMBNAIL_SIZE;
                var ratio = resizeHeight / metadata.height;
                resizeWidth = Math.round(metadata.width * ratio);
            }
            else {
                resizeWidth = THUMBNAIL_SIZE;
                var ratio = resizeWidth / metadata.width;
                resizeHeight = Math.round(metadata.height * ratio);
            }

            img.resize(resizeWidth, resizeHeight)
                .png()
                .toBuffer()
                .then(function(buffer) {
                    if (callback) callback(buffer);

                    fs.writeFile(
                        thumbnailPath,
                        buffer,
                        "binary"
                    );
                });
        });
    }
}

methods.getVideoThumbnail = function(filePath, callback) {
    const pathInfo = path.parse(filePath);
    const thumbnailPath = THUMBNAIL_CACHE_PATH + pathInfo.name + ".png"

    if (fs.existsSync(thumbnailPath)) {
        callback(fs.readFileSync(thumbnailPath));
    }
    else {
        const tempThumbnailName = "temp-" + pathInfo.name + ".png"

        ffmpeg(filePath)
        .on("end", function() {
            const img = sharp(THUMBNAIL_CACHE_PATH + tempThumbnailName);
            img.metadata().then(function(metadata) {
                var resizeWidth = 0;
                var resizeHeight = 0;

                if (metadata.width > metadata.height) {
                    resizeHeight = THUMBNAIL_SIZE;
                    var ratio = resizeHeight / metadata.height;
                    resizeWidth = Math.round(metadata.width * ratio);
                }
                else {
                    resizeWidth = THUMBNAIL_SIZE;
                    var ratio = resizeWidth / metadata.width;
                    resizeHeight = Math.round(metadata.height * ratio);
                }

                img.resize(resizeWidth, resizeHeight)
                    .png()
                    .toBuffer()
                    .then(function(buffer) {
                        fs.unlink(THUMBNAIL_CACHE_PATH + tempThumbnailName);
                        if (callback) callback(buffer);
                        fs.writeFile(
                            thumbnailPath,
                            buffer,
                            "binary"
                        );
                    });
            });
        })
        .screenshots({
            timestamps: ["50%"],
            filename: tempThumbnailName,
            folder: THUMBNAIL_CACHE_PATH
        });
    }
}

module.exports = methods;
