var sqlite = require("sqlite3");
var Constants = require("./helpers/constants");

var db;

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
                        PRIMARY KEY (filename));`,
                        
            function() {
                console.log("Database initialized.");
                callback(db);
            });
        });
    }
}

module.exports = initialize;