const router = require("express").Router();
const fs = require("fs");

const Constants = require("../helpers/constants");
const Photo = require("../models/Photo")
const Video = require("../models/Video")

const PHOTOS=0
const VIDEOS=1

const STAGE_NONE=0;
const STAGE_INDEX=1;
const STAGE_PROCESS=2;
const STAGE_STATS_CACHE=3;
const STAGE_COMPLETE=4;

var db;

var stage = STAGE_NONE;
var errors = [];

var timeStarted = 0;
var timeCompleted = 0;
var processCount = 0;
var totalMedia = 0;
var completedMedia = 0;
var files = [];
var modifiedYears = [];
var modifiedAlbums = [];

function updateIndex() {
    errors = [];
    stage = STAGE_INDEX;
    totalMedia = 0;
    completedMedia = 0;
    timeStarted = Math.floor(Date.now() / 1000);
    timeCompleted = 0;

    gatherFiles(PHOTOS, Constants.PHOTOS_DIR); // Gather photos files
    gatherFiles(VIDEOS, Constants.VIDEOS_DIR); // Gather videos files
}

function updateCompleted() {
    stage = STAGE_COMPLETE;
    files = [];
    modifiedAlbums = [];
    modifiedYears = [];    
    timeCompleted = Math.floor(Date.now() / 1000);

    console.log("Indexer completed.");
}

function gatherFiles(mediaType, directory, level=0) {
    console.log(`Gathering ${mediaType == PHOTOS ? "photo" : "video"} files at ${directory} (Level ${level})...`);

    // Keep track of how many async procsesses are running
    processCount++;

    fs.readdir(directory, (err, dirFiles) => {
        if (dirFiles) {
            for (var i = 0; i < dirFiles.length; i++) {
                var fullPath = `${directory}/${dirFiles[i]}`;
                var stat = fs.statSync(fullPath);
                if (stat) {
                    if (stat.isDirectory()) {
                        if (level < 2) { // Level 1=Year, Level 2=Album
                            if (level == 0 && isNaN(parseInt(dirFiles[i]))) {
                                recordError('w', `Expected year at directory: ${fullPath}.`);
                            }
                            else {
                                gatherFiles(mediaType, fullPath, level+1);
                            }
                        }
                        else {
                            recordError('w', `Unexpected directory within album at ${fullPath}.`)
                        }
                    }
                    else if (level == 2) {
                        var model = null;
                        if (mediaType == PHOTOS) {
                            model = new Photo(fullPath);
                        }
                        else {
                            model = new Video(fullPath);
                        }

                        if (model.hasValidExtension()) {
                            files.push(model);
                            totalMedia++;
                        }
                        else {
                            recordError('w', `File ${fullPath} has an invalid mime-type for a ${mediaType == PHOTOS ? "photo" : "video"}.`)
                        }
                    }
                }
                else {
                    recordError('e', `Unable to stat ${fullPath}`)
                }
            }

            // Keep track of how many processes are running
            if (--processCount == 0) {
                gatherFilesCompleted();
            }
        }
        else {
            recordError('e', `Directory not found: ${directory}`);

            // Keep track of how many processes are running
            if (--processCount == 0) {
                gatherFilesCompleted();
            }
        }
    });
}

function gatherFilesCompleted() {
    setTimeout(function() {
        if (processCount == 0 && stage == STAGE_INDEX) {
            console.log("Completed file search.");

            if (files.length == 0) {
                recordError('w', "No files were found during directory scan!");
                updateCompleted();
            }
            else {
                stage = STAGE_PROCESS;
                processNextFile()
            }
        }
    }, 1000);
}

function processNextFile() {
    var media = files.pop();

    var processCompleted = function() {
        completedMedia++;
        if (files.length == 0) {
            updateStats();
        }
        else {
            processNextFile();
        }
    }

    if (media.type == "photo") {
        processPhoto(media, processCompleted);
    }
    else if (media.type == "video") {
        processVideo(media, processCompleted);        
    }
}

function processPhoto(photo, callback) {
    console.log(`Processing photo ${photo.path} [${completedMedia+1}/${totalMedia}]...`);

    // Verify photo doesn't already exist in database.
    db.get("SELECT year, album FROM photos WHERE filename = ?", photo.filename, function(error, row) {
        if (error) {
            recordError('w', `Database error while processing ${photo.path}: ${error}`);
            callback();
        }
        else {
            // Only add database information if photo doesn't exist
            if (!row) {
                photo.readExif(function(error) {
                    if (error) {
                        console.log(error);
                    }

                    if (modifiedAlbums.indexOf(`${photo.year}/${photo.album}`) < 0) {
                        modifiedAlbums.push(`${photo.year}/${photo.album}`);
                    }

                    if (modifiedYears.indexOf(photo.year) < 0) {
                        modifiedYears.push(photo.year);
                    }

                    db.run(`
                        INSERT INTO photos (
                            filename,
                            album,
                            year,
                            timestamp,
                            suspect_time,
                            rotation,
                            width,
                            height,
                            make,
                            model,
                            lens_model,
                            filesize,
                            fnumber,
                            exposure_time,
                            focal_length,
                            iso,
                            latitude,
                            longitude,
                            direction,
                            added_timestamp
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

                        [
                            photo.filename,
                            photo.album,
                            photo.year,
                            photo.getTimestamp(recordError),
                            photo.suspectTime,
                            photo.getRotation(),
                            photo.getWidth(),
                            photo.getHeight(),
                            photo.getMake(),
                            photo.getModel(),
                            photo.getLensModel(),
                            photo.getFilesize(),
                            photo.getFNumber(),
                            photo.getExposureTime(),
                            photo.getFocalLength(),
                            photo.getISO(),
                            photo.getGPSLatitude(),
                            photo.getGPSLongitude(),
                            photo.getGPSDirection(),
                            timeStarted
                        ],

                        function(err) {
                            if (err) {
                                recordError("w", `Database error while processing ${photo.filename}: ${err}`);
                            }

                            callback();
                        });
                });
            }
            else {
                if (row.year != photo.year || row.album != photo.album) {
                    recordError('w', `Found duplicate files ${photo.path} and ${PHOTOS_DIR}/${row.year}/${row.album}/${row.filename}`)
                }
                callback();
            }
        }
    });
}

function processVideo(video, callback) {
    console.log(`Processing video ${video.path} [${completedMedia+1}/${totalMedia}]...`);

    // Verify video doesn't already exist in database.
    db.get("SELECT year, album FROM videos WHERE filename = ?", video.filename, function(error, row) {
        if (error) {
            recordError('w', `Database error while processing ${video.path}: ${error}`);
            callback();
        }
        else {
            // Only add database information if video doesn't exist
            if (!row) {
                video.probe(function(error) {
                    if (error) {
                        console.log(error);
                    }

                    if (modifiedAlbums.indexOf(`${video.year}/${video.album}`) < 0) {
                        modifiedAlbums.push(`${video.year}/${video.album}`);
                    }

                    if (modifiedYears.indexOf(video.year) < 0) {
                        modifiedYears.push(video.year);
                    }

                    db.run(`
                        INSERT INTO videos (
                            filename,
                            album,
                            year,
                            timestamp,
                            suspect_time,
                            rotation,
                            width,
                            height,
                            length,
                            filesize,
                            format,
                            video_codec,
                            pixel_format,
                            framerate,
                            scanning_method,
                            audio_codec,
                            audio_channels,
                            audio_channel_layout,
                            audio_sample_rate,
                            audio_bitrate,
                            added_timestamp
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

                        [
                            video.filename,
                            video.album,
                            video.year,
                            video.getTimestamp(recordError),
                            video.suspectTime,
                            0,
                            video.getWidth(),
                            video.getHeight(),
                            video.getLength(),
                            video.getFilesize(),
                            video.getFormat(),
                            video.getVideoCodec(),
                            video.getPixelFormat(),
                            video.getFramerate(),
                            video.getScanningMethod(),
                            video.getAudioCodec(),
                            video.getAudioChannels(),
                            video.getAudioChannelLayout(),
                            video.getAudioSampleRate(),
                            video.getAudioBitrate(),
                            timeStarted
                        ],

                        function(err) {
                            if (err) {
                                recordError("w", `Database error while processing ${video.filename}: ${err}`);
                            }

                            callback();
                        });
                });
            }
            else {
                if (row.year != video.year || row.album != video.album) {
                    recordError('w', `Found duplicate files ${video.path} and ${Constants.VIDEOS_DIR}/${row.year}/${row.album}/${row.filename}`)
                }
                callback();
            }
        }
    });
}

function updateStats() {
    console.log("Updating cached statistics...");
    stage = STAGE_STATS_CACHE

    db.parallelize(function() {
        for (var i = 0; i < modifiedAlbums.length; i++) {
            var albumKey = modifiedAlbums[i].split('/');
            db.run(`
                REPLACE INTO albums (
                    album,
                    year,
                    photos,
                    videos,
                    time_start,
                    time_end
                )
                SELECT
                    $album,
                    $year,
                    (
                        SELECT COUNT(1)
                        FROM photos
                        WHERE album = $album AND year = $year
                    ),
                    (
                        SELECT COUNT(1)
                        FROM videos
                        WHERE album = $album AND year = $year
                    ),
                    MIN(timestamp),
                    MAX(timestamp)
                FROM (
                    SELECT timestamp FROM photos WHERE album = $album AND year = $year AND suspect_time=0
                    UNION ALL
                    SELECT timestamp FROM videos WHERE album = $album AND year = $year AND suspect_time=0
                ) ts`, {
                    $album: albumKey[1],
                    $year: albumKey[0]
                });
        }

        for (var i = 0; i < modifiedYears.length; i++) {
            db.run(` 
                REPLACE INTO years (
                    year,
                    albums,
                    photos,
                    videos
                )
                SELECT
                    $year,
                    (
                        SELECT COUNT(1)
                        FROM albums
                        WHERE year = $year
                    ),
                    (
                        SELECT COUNT(1)
                        FROM photos
                        WHERE year = $year
                    ),
                    (
                        SELECT COUNT(1)
                        FROM videos
                        WHERE year = $year
                    )
            `, {
                $year: modifiedYears[i]
            });
        }

        updateCompleted();
    }); 
}

function recordError(type, message) {
    console.log("[" + type + "] " + message);
    errors.push({'t': type, 'm': message});
}

router.get("/", function(req, res) {
    var result = {success: true};

    if (stage == STAGE_INDEX || stage == STAGE_PROCESS || stage == STAGE_STATS_CACHE) {
        res.statusCode = 409;
        result.success = false;
        result.error = "update_in_progress";
    }
    else {
        updateIndex(); 
        db = req.db;
    }

    res.json(result);
});

router.get("/status", function(req, res) {
    var result = {success: true};

    if (stage == STAGE_NONE) {
        res.statusCode = 404;
        result.success = false;
        result.error = "no_activity";
    }
    else {
        result.stage = stage;
        result.start_time = timeStarted;
        result.stop_time = timeCompleted;
        result.total_files = totalMedia;
        result.completed_files = completedMedia;
        result.errors = errors;
    }

    res.json(result);
});

module.exports = router;