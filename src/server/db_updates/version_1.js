const Constants = require("../helpers/constants");
const fs = require("fs");

const UPGRADE_VERSION=1;

function populateAddedTimestamp(db, callback) {
    console.log("Using file last modified time as time added...");

    var firstCompleted = false;

    const completed = function() {
        if (firstCompleted)
            callback(false);
        else
            firstCompleted = true;
    }

    db.all("SELECT filename, year, album FROM photos", function(err, rows) {
        if (err) {
            callback(err);
        }
        else {
            var files = rows;
            const processFile = function() {
                var fileInfo = files.pop();
                fs.stat(`${Constants.PHOTOS_DIR}/${fileInfo.year}/${fileInfo.album}/${fileInfo.filename}`,
                    function(err, stats) {
                        if (err) {
                            console.log(`Unable to stat ${fileInfo.fileName}: ${err}`);
                            callback(err);
                        }
                        else {
                            db.run("UPDATE photos SET added_timestamp=? WHERE filename=?;",
                            [(stats.mtime / 1000), fileInfo.filename],
                            function(err) {
                                if (err) {
                                    console.error(`Unable to update timestamp of file: ${fileInfo.filename}`);
                                    callback(err);
                                }
                                else if (files.length > 0) {
                                    processFile();
                                }
                                else {
                                    completed();
                                }   
                            });
                        }
                    });
            }

            processFile();
        }
    });

    db.all("SELECT filename, year, album FROM videos", function(err, rows) {
        if (err) {
            callback(err);
        }
        else {
            var files = rows;
            const processFile = function() {
                var fileInfo = files.pop();
                fs.stat(`${Constants.VIDEOS_DIR}/${fileInfo.year}/${fileInfo.album}/${fileInfo.filename}`,
                    function(err, stats) {
                        if (err) {
                            console.log(`Unable to stat ${fileInfo.fileName}: ${err}`);
                            callback(err);
                        }
                        else {
                            db.run("UPDATE photos SET added_timestamp=? WHERE filename=?;",
                            [(stats.mtime / 1000), fileInfo.filename],
                            function(err) {
                                if (err) {
                                    console.error(`Unable to update timestamp of file: ${fileInfo.filename}`);
                                    callback(err);
                                }
                                else if (files.length > 0) {
                                    processFile();
                                }
                                else {
                                    completed();
                                }   
                            });
                        }
                    });
            }

            processFile();
        }
    });
}

function upgrade(db, finalCallback) {
    db.run("ALTER TABLE photos ADD added_timestamp INT;", function(err) {
        if (err) {
            console.error("Failed to add column to photos schema.");
            finalCallback(error);
        }
        else {
            db.run("ALTER TABLE videos ADD added_timestamp INT;", function(err) {
                if (err) {
                    console.error("Failed to add column to videos schema.");
                }
                else {
                    populateAddedTimestamp(db, function(err) {
                        if (err) {
                            finalCallback(err);
                        }
                        else {
                            finalCallback(false);
                            db.run(`REPLACE INTO settings (key, value) VALUES('db_version', ${UPGRADE_VERSION});`, function(error) {
                                if (error) {
                                    finalCallback(error);
                                }
                                else {
                                    finalCallback(false);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

module.exports = upgrade;