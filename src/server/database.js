const sqlite = require("sqlite3");
const fs = require("fs");

const Constants = require("./helpers/constants");

var db;

function updateDB(fromVersion, callback) {
    const nextVersion = fromVersion+1;

    console.log(`Upgrading database from version ${fromVersion} to ${nextVersion}...`);

    var upgrade = require(`./db_updates/version_${nextVersion}.js`)

    upgrade(db, function(err) {
        if (err) {
            console.error(`Error running database upgrade: ${err}`);
            callback(err);
        }
        else if (nextVersion < Constants.DB_VERSION) {
            update_db(nextVersion, callback);
        }
        else {
            console.log("Database updates are complete.");
            callback(false);
        }
    });
}

function initialize(callback) {
    console.log("Opening database...");

    db = new sqlite.Database(`${Constants.DATA_DIR}/db.sqlite3`, opened);

    function opened() {
        console.log("Preparing database...");

        db.serialize(function() {
            db.run(`CREATE TABLE IF NOT EXISTS geodecode_cache (
                lat NUMERIC NOT NULL,
                lon NUMERIC NOT NULL,
                location TEXT,
                PRIMARY KEY (lat, lon));`);

            db.run(`CREATE TABLE IF NOT EXISTS albums (
                        album TEXT NOT NULL,
                        year INTEGER NOT NULL,
                        photos INTEGER,
                        videos INTEGER,
                        time_start INTEGER,
                        time_end INTEGER,
                        PRIMARY KEY (album, year));`);
            
            db.run(`CREATE TABLE IF NOT EXISTS years (
                year INTEGER NOT NULL,
                albums INTEGER,
                photos INTEGER,
                videos INTEGER,
                PRIMARY KEY (year));`);
    
            db.run(`CREATE TABLE IF NOT EXISTS photos (
                        filename TEXT NOT NULL,
                        album TEXT NOT NULL,
                        year INTEGER NOT NULL,
                        timestamp INTEGER NOT NULL,
                        suspect_time INTEGER NOT NULL,
                        rotation INTEGER NOT NULL,
                        width INTEGER NOT NULL,
                        height INTEGER NOT NULL,
                        make TEXT,
                        model TEXT,
                        lens_model TEXT,
                        filesize INTEGER NOT NULL,
                        fnumber INTEGER,
                        exposure_time INTEGER,
                        focal_length INTEGER,
                        iso INTEGER,
                        latitude TEXT,
                        longitude TEXT,
                        direction INTEGER,
                        comment TEXT,
                        PRIMARY KEY (filename));`);

            db.run(`CREATE TABLE IF NOT EXISTS videos (
                        filename TEXT NOT NULL,
                        album TEXT NOT NULL,
                        year INTEGER NOT NULL,
                        timestamp INTEGER NOT NULL,
                        suspect_time INTEGER NOT NULL,
                        rotation INTEGER NOT NULL,
                        width NOT NULL,
                        height NOT NULL,
                        length INTEGER NOT NULL,
                        filesize INTEGER NOT NULL,
                        format TEXT,
                        video_codec TEXT,
                        pixel_format TEXT,
                        framerate TEXT,
                        scanning_method TEXT,
                        audio_codec TEXT,
                        audio_channels INTEGER,
                        audio_channel_layout TEXT,
                        audio_sample_rate TEXT,
                        audio_bitrate INTEGER,
                        comment TEXT,
                        PRIMARY KEY (filename));`);

            db.run(`CREATE TABLE IF NOT EXISTS settings (
                        key TEXT NOT NULL,
                        value TEXT,
                        PRIMARY KEY (key));`,
            function() {
                console.log("Checking for database updates...");

                db.get("SELECT value FROM settings WHERE key='db_version'", function (err, row) {
                    if (row) {
                        console.log(`Current version: ${row.value} Latest version: ${Constants.DB_VERSION}`);

                        if (row.value < Constants.DB_VERSION) {
                            console.log("Backing up SQLite file in case of catastrophe...");

                            fs.copyFileSync(`${Constants.DATA_DIR}/db.sqlite3`, `${Constants.DATA_DIR}/db-upgrade_backup.sqlite3`)

                            updateDB(parseInt(row.value), function(err) {
                                if (err) {
                                    console.log("Restoring database backup...");

                                    db.close(function() {
                                        fs.unlinkSync(`${Constants.DATA_DIR}/db.sqlite3`);
                                        fs.renameSync(`${Constants.DATA_DIR}/db-upgrade_backup.sqlite3`, `${Constants.DATA_DIR}/db.sqlite3`);
                                        process.exit(1);
                                    });
                                }
                                else {
                                    fs.unlinkSync(`${Constants.DATA_DIR}/db-upgrade_backup.sqlite3`);
                                    callback(db);
                                }
                            });
                        }
                        else {
                            callback(db);
                        }
                    }
                    else {
                        console.log("Fresh install. Populating empty settings...");
                        db.serialize(function() {
                            db.run(`INSERT INTO settings VALUES('db_version', '${Constants.DB_VERSION}');`);
                        });
                    }
                });
            });
        });
    }
}

module.exports = initialize;