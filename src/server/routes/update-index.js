const router = require("express").Router();
const fs = require("fs");
const Photo = require("../models/Photo")
const Video = require("../models/Video")

const MODE_NONE = 0;
const MODE_PHOTOS = 1;
const MODE_VIDEOS = 2;
const MODE_STATS = 3;
const MODE_FINISHED = 4;

var db;

var updating = false;
var mode = MODE_NONE;
var directoryProcesses = 0;
var processingFiles = false;

var pendingFiles = [];
var modifiedAlbums = [];
var modifiedYears = [];

var timePhotosStarted = 0;
var timePhotosFinished = 0;
var timeVideosStarted = 0;
var timeVideosFinished = 0;
var completedPhotos = 0;
var totalPhotos = 0;
var completedVideos = 0;
var totalVideos = 0;
var errors = [];

function resetProcessVariables() {
    timePhotosStarted = 0;
    timePhotosFinished = 0;
    timeVideosStarted = 0;
    timeVideosFinished = 0;
    completedPhotos = 0;
    totalPhotos = 0;
    completedVideos = 0;
    totalVideos = 0;
    errors = [];
}

function recordError(type, message) {
    console.log("[" + type + "] " + message);
    errors.push({'t': type, 'm': message});
}

function updatePhotoIndex() {
    console.log("Photo indexing started.")
    updating = true;
    mode = MODE_PHOTOS;
    timePhotosStarted = Math.floor(Date.now() / 1000);
    readFolder("./content/photos");
}

function updateVideoIndex() {
    console.log("Video indexing started.")
    updating = true;
    mode = MODE_VIDEOS;
    timeVideosStarted = Math.floor(Date.now() / 1000);
    readFolder("./content/videos");
}

function finished() {
    updating = false;
    mode = MODE_FINISHED;

    console.log("");
    console.log("Finished updating index!");
    console.log("");
}

function updateStats() {
    console.log("Updating indexes and cached statistics...");
    mode = MODE_STATS;

    for (var i = 0; i < modifiedAlbums.length; i ++) {
        var album = modifiedAlbums[i].split("/");
        var queryString = `
            REPLACE INTO \`albums\`(\`album\`, \`year\`, \`photos\`, \`videos\`, \`time_start\`, \`time_end\`)
            SELECT
                ?,
                ?,
                (SELECT COUNT(*) FROM \`photos\` WHERE \`album\` = ? AND \`year\` = ?),
                (SELECT COUNT(*) FROM \`videos\`WHERE \`album\` = ? AND \`year\` = ?),
                MIN(\`timestamp\`),
                MAX(\`timestamp\`)
            FROM
                (
                    SELECT \`filename\`, \`album\`, \`year\`, \`timestamp\` FROM \`videos\` WHERE \`album\` = ? AND \`year\` = ?
                    UNION ALL
                    SELECT \`filename\`, \`album\`, \`year\`, \`timestamp\` FROM \`photos\` WHERE \`album\` = ? AND \`year\` = ?
                ) \`media\`
        `;

        db.query(queryString, [
            album[1], album[0],
            album[1], album[0],
            album[1], album[0],
            album[1], album[0],
            album[1], album[0]
        ]);
    }

    modifiedAlbums = [];

    for (var i = 0; i < modifiedYears.length; i++) {
        var queryString = `
            REPLACE INTO \`years\`(\`year\`, \`albums\`, \`photos\`, \`videos\`)
            SELECT
                ?,
                (SELECT COUNT(*) FROM \`albums\` WHERE \`year\` = ?),
                (SELECT COUNT(*) FROM \`photos\` WHERE \`year\` = ?),
                (SELECT COUNT(*) FROM \`videos\`WHERE \`year\` = ?)
        `;
        db.query(queryString, [modifiedYears[i], modifiedYears[i], modifiedYears[i], modifiedYears[i]]);
    }

    modifiedYears = [];
    finished();
}

function photosFinished() {
    timePhotosFinished = Math.floor(Date.now() / 1000);
    mode = MODE_NONE;

    console.log("");
    console.log("Photos finished!");
    console.log("");

    updateVideoIndex();
}

function videosFinished() {
    timeVideosFinished = Math.floor(Date.now() / 1000);
    mode = MODE_NONE;

    console.log("");
    console.log("Videos finished!");
    console.log("");

    updateStats();
}

function nextFile() {
    pendingFiles.shift();
    if (mode == MODE_PHOTOS)
        completedPhotos++;
    else if (mode == MODE_VIDEOS)
        completedVideos++;

    if (pendingFiles.length > 0) {
        if (mode == MODE_PHOTOS)
            processPhoto(pendingFiles[0]);
        else if (mode == MODE_VIDEOS)
            processVideo(pendingFiles[0]);
    }
    else {
        processingFiles = false;

        // We're not looking through directories still, safe to it quits
        if (directoryProcesses == 0) {
            if (mode == MODE_PHOTOS)
                photosFinished();
            else if (mode == MODE_VIDEOS)
                videosFinished();
        }
    }
}

function processPhoto(photo) {
    processingFiles = true;
    console.log("Processing photo " + photo.path + "...");

    db.query("SELECT `year`, `album` FROM `photos` WHERE `filename` = ?", [photo.filename], function(error, results, fields) {
        if (error) {
            recordError('w', "Database error while processing " + photo.path + ": " + error);
            nextFile();
        }
        else {
            if (results.length > 0) {
                if (results[0].year != photo.year || results[0].album != photo.album) {
                    recordError('w', "Duplicate filename found " + photo.path + " for existing " + results[0].year + "/" + results[0].album + "/" + photo.filename);
                }
                nextFile();
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

                    if (!modifiedAlbums.indexOf(photo.year + "/" + photo.album) > -1) {
                        modifiedAlbums.push(photo.year + "/" + photo.album);
                    }
                    if (!modifiedYears.indexOf(photo.year) > -1) {
                        modifiedYears.push(photo.year);
                    }

                    nextFile();
                });
            }
        }
    });
}

function processVideo(video) {
    processingFiles = true;
    console.log("Processing video " + video.path + "...");

    db.query("SELECT `year`, `album` FROM `videos` WHERE `filename` = ?", [video.filename], function(error, results, fields) {
        if (error) {
            recordError('w', "Database error while processing " + video.path + ": " + error);
            nextFile();
        }
        else {
            if (results.length > 0) {
                if (results[0].year != video.year || results[0].album != video.album) {
                    recordError('w', "Duplicate filename found " + video.path + " for existing " + results[0].year + "/" + results[0].album + "/" + video.filename);
                }
                nextFile();
            }
            else {
                video.probe(function(error) {
                    if (error) {
                        console.log(error);
                    }

                    db.query("INSERT INTO `videos` VALUES(?, ?, ?, ?, ?, ?, ?)", [
                        video.filename,
                        video.year,
                        video.album,
                        video.getTimestamp(recordError),
                        video.suspectTime,
                        video.getLength(),
                        null
                    ]);

                    if (!modifiedAlbums.indexOf(video.year + "/" + video.album) > -1) {
                        modifiedAlbums.push(video.year + "/" + video.album);
                    }
                    if (!modifiedYears.indexOf(video.year) > -1) {
                        modifiedYears.push(video.year);
                    }

                    nextFile();
                });
            }
        }
    });
}

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
                        if (mode == MODE_PHOTOS) {
                            obj = new Photo(directory + "/" + files[i]);
                        }
                        else if (mode == MODE_VIDEOS) {
                            obj = new Video(directory + "/" + files[i]);
                        }

                        if (obj.hasValidExtension()) {
                            pendingFiles.push(obj);

                            // Start the file processer
                            if (mode == MODE_PHOTOS) {
                                totalPhotos++;
                                if (!processingFiles) {
                                    processPhoto(pendingFiles[0]);
                                }
                            }
                            else if (mode == MODE_VIDEOS) {
                                totalVideos++;
                                if (!processingFiles) {
                                    processVideo(pendingFiles[0]);
                                }
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
                if (mode == MODE_PHOTOS) {
                    photosFinished();
                }
                else if (mode == MODE_VIDEOS) {
                    videosFinished();
                }
            }
        }
    })
}

router.get("/", function(req, res) {
    var result = {success: true};

    if (updating) {
        res.statusCode = 409;
        result.success = false;
        result.error = "update_in_progress";
    }
    else {
        resetProcessVariables();
        updatePhotoIndex();
        db = req.db;
    }

    res.json(result);
});

router.get("/status", function(req, res) {
    var result = {success: true};

    if (mode == MODE_NONE) {
        res.statusCode = 404;
        result.success = false;
        result.error = "no_activity";
    }
    else {
        result.mode = mode;
        result.photos_start_time = timePhotosStarted;
        result.photos_stop_time = timePhotosFinished;
        result.videos_start_time = timeVideosStarted;
        result.videos_stop_time = timeVideosFinished;
        result.reading_directories = (directoryProcesses > 0);
        result.photos_completed = completedPhotos;
        result.photos_total = totalPhotos;
        result.videos_completed = completedVideos;
        result.videos_total = totalVideos;
        result.errors = errors;
    }

    res.json(result);
});

module.exports = router;
