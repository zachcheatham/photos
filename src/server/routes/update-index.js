const router = require("express").Router();
const fs = require("fs");
const Photo = require("../models/Photo")

var db;

var updating = false;
var updatingPhotos = false;
var timePhotosStarted = 0;
var timePhotosFinished = 0;
var timeVideosStarted = 9;
var timeVideosFinished = 0;

var directoryProcesses = 0;
var processingFiles = false;
var pendingFiles = [];

var completedPhotos = 0;
var totalPhotos = 0;
var completedVideos = 0;
var totalVideos = 0;

var errors = [];

function recordError(type, message) {
    console.log("[" + type + "] " + message);
    errors.push({'t': type, 'm': message});
}

function photosFinished() {
    timePhotosFinished = Math.floor(Date.now() / 1000);
    updatingPhotos = false;
}

function nextPhoto() {
    pendingFiles.shift();
    completedPhotos++;

    if (pendingFiles.length > 0) {
        processPhoto(pendingFiles[0]);
    }
    else {
        processingFiles = false;

        // We're not looking through directories still, safe to call photos done
        if (directoryProcesses == 0) {
            photosFinished();
        }
        // Otherwise, the directory reader will start the queue again
    }
}

function processPhoto(photo) {
    processingFiles = true;
    console.log("Processing photo " + photo.path + "...");

    db.query("SELECT `year`, `album` FROM `photos` WHERE `filename` = ?", [photo.filename], function(error, results, fields) {
        if (error) {
            recordError('w', "Database error while processing " + photo.path + ": " + error);
            nextPhoto();
        }
        else {
            if (results.length > 0) {
                if (results[0].year != photo.year || results[0].album != photo.album) {
                    recordError('w', "Duplicate filename found " + photo.path + " for existing " + results[0].year + "/" + results[0].album + "/" + photo.filename);
                }
                nextPhoto();
            }
            else {
                photo.readExif(function(error) {
                    if (error) {
                        console.log(error);
                    }

                    db.query("INSERT INTO `photos` VALUES(?, ?, ?, ?, ?, ?, ?)", [
                            photo.filename,
                            photo.album,
                            photo.year,
                            photo.getTimestamp(recordError),
                            photo.suspectTime,
                            photo.getRotation(),
                            null
                        ], function(error, results, fields) {
                            if (error) {
                                recordError('w', "Error saving " + photo.path + " to database: " + error);
                            }
                        }
                    );

                    nextPhoto();
                });
            }
        }
    });
}
//
function readFolder(directory, level=0) {
    directoryProcesses += 1;
    console.log("Reading directory " + directory +"...")
    fs.readdir(directory, function(err, files) {
        for (var i = 0; i < files.length; i++) {
            var stat = fs.statSync(directory + "/" + files[i]);
            if (stat) {
                if (stat.isDirectory()) {
                    if (level < 2) {
                        if (level == 0 && isNaN(parseInt(files[i]))) {
                            recordError('w', "Non-numerical directory " + directory + "/" + files[i] + " found in root folder.");
                        }
                        else {
                            readFolder(directory + "/" + files[i], level+1);
                        }
                    }
                    else {
                        recordError('w', "Unexpected directory " + directory + "/" + files[i] + " found in album folder.");
                    }
                }
                else {
                    if (level == 2) {
                        var obj = null;
                        if (updatingPhotos) {
                            obj = new Photo(directory + "/" + files[i])
                        }

                        if (obj.hasValidExtension()) {
                            pendingFiles.push(obj);
                            if (updatingPhotos) {
                                totalPhotos++;
                                if (!processingFiles) {
                                    processPhoto(pendingFiles[0]);
                                }
                            }
                            else {
                                totalVideos++;
                            }
                        }
                        else {
                            recordError('w', "File " + obj.path + " has an invalid mime-type.");
                        }
                    }
                }
            }
            else {
                recordError('e', "Unable to stat " + directory + "/" + files[i]);
            }
        }
        directoryProcesses -= 1;
        if (directoryProcesses == 0) {
            console.log("");
            console.log("Completed finding files!");
            console.log("");
            if (pendingFiles.length == 0) {
                recordError("w", "Directory scan finished with no files found.");
                if (updatingPhotos)
                    photosFinished()
            }
        }
    })
}

function updatePhotoIndex(db) {
    updating = true;
    updatingPhotos = true;
    timePhotosStarted = Math.floor(Date.now() / 1000);
    readFolder("./content/photos");
}

router.get("/", function(req, res) {
    var result = {success: true};

    if (updating) {
        res.statusCode = 409;
        result.success = false;
        result.error = "update_in_progress";
    }
    else {
        // Reset all our VALUES
        completedPhotos = 0;
        totalPhotos = 0;
        completedVideos = 0;
        totalVideos = 0;
        timePhotosStarted = 0;
        timePhotosFinished = 0;
        timeVideosStarted = 0;
        timeVideosFinished = 0;
        errors = [];

        updatePhotoIndex();
        db = req.db;
    }

    res.json(result);
});

router.get("/status", function(req, res) {
    var result = {success: true};

    if (timePhotosStarted == 0) {
        res.statusCode = 404;
        result.success = false;
        result.error = "no_activity";
    }
    else {
        result.finished = !updating;
        result.photos_start_time = timePhotosStarted;
        result.photos_stop_time = timePhotosFinished;
        result.videos_start_time = timeVideosStarted;
        result.videos_stop_time = timeVideosFinished;

        if (updating) {
            result.mode = (updatingPhotos && "photos" || "videos");
            result.reading_directories = (directoryProcesses > 0);
            result.photos_completed = completedPhotos;
            result.photos_total = totalPhotos;
            result.videos_completed = completedVideos;
            result.videos_total = totalVideos;
            result.errors = errors;
        }
    }

    res.json(result);
});

module.exports = router;
