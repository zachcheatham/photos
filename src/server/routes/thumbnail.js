const router = require("express").Router();
const fs = require("fs");

const Constants = require("../helpers/constants");
const thumbnails = require("../helpers/thumbnails");

router.get("/album/:year/:album", function(req, res) {
    const year = parseInt(req.params.year);
    const album = req.params.album;

    if (isNaN(year)) {
        res.statusCode = 400;
        res.json({
            "success": false,
            "year": req.params.year,
            "album": album,
            "error": "invalid_year"
        });
    }
    else {
        req.db.get("SELECT COUNT(1) as cnt FROM albums WHERE year = ? AND album = ?",
            [year, album],
            function(error, row) {
                if (error) {
                    res.statusCode = 500;
                    res.json({
                        "success": false,
                        "year": year,
                        "album": album,
                        "error": "database_error",
                        "error_extra": error
                    });
                }
                else {
                    var exists = row.cnt > 0;
                    if (!exists) {
                        res.statusCode = 404;
                        res.json({
                            "success": false,
                            "year": year,
                            "album": album,
                            "error": "not_found"
                        });
                    }
                    else {
                        req.db.get(`
                            SELECT
                                filename,
                                type
                            FROM
                            (
                                SELECT filename, "videos" as type FROM videos WHERE album = $album AND year = $year
                                UNION ALL
                                SELECT filename, "photos" as type FROM photos WHERE album = $album AND year = $year
                            ) media
                            ORDER BY RANDOM()
                            LIMIT 1`,
                            {$album: album, $year: year},
                            function(error, row) {
                                if (error) {
                                    res.statusCode = 500;
                                    res.json({
                                        "success": false,
                                        "year": year,
                                        "album": album,
                                        "error": "database_error",
                                        "error_extra": error.code
                                    });
                                }
                                else if (!row) {
                                    res.statusCode = 404;
                                    res.json({
                                        "success": false,
                                        "year": year,
                                        "album": album,
                                        "error": "empty_album"
                                    });
                                }
                                else {
                                    if (row.type == "photos") {
                                        var filePath = `${Constants.PHOTOS_DIR}/${year}/${album}/${row.filename}`
                                        thumbnails.getPhotoThumbnail(filePath, function(data) {
                                            res.writeHead(200, {"Content-Type": "image/png"});
                                            res.end(data, "binary");
                                        });
                                    }
                                    else if (row.type == "videos") {
                                        var filePath = `${Constants.VIDEOS_DIR}/${year}/${album}/${row.filename}`
                                        thumbnails.getVideoThumbnail(filePath, function(data) {
                                            res.writeHead(200, {"Content-Type": "image/png"});
                                            res.end(data, "binary");
                                        })
                                    }
                                }
                            }
                        )
                    }
                }
            }
        )
    }
});

router.get("/:filename", function(req, res) {
    const filename = req.params.filename;

    req.db.get(`
        SELECT
            year,
            album,
            type
        FROM
        (
            SELECT year, album, "videos" as type FROM videos WHERE filename = $file
            UNION ALL
            SELECT year, album, "photos" as type FROM photos WHERE filename = $file
        ) media
        ORDER BY RANDOM()
        LIMIT 1`,
        {$file: filename},
        function(error, row) {
            if (error) {
                res.statusCode = 500;
                res.json({
                    "success": false,
                    "filename": filename,
                    "error": "database_error",
                    "error_extra": error.code
                });
            }
            else if (!row) {
                res.statusCode = 404;
                res.json({
                    "success": false,
                    "filename": filename,
                    "error": "not_found"
                });
            }
            else {
                var contentRoot = ""
                if (row.type == "photos") {
                    contentRoot = Constants.PHOTOS_DIR;
                }
                else {
                    contentRoot = Constants.VIDEOS_DIR;
                }

                const filePath = `${contentRoot}/${row.year}/${row.album}/${filename}`;
                if (row.type == "photos") {
                    thumbnails.getPhotoThumbnail(filePath, function(data) {
                        res.writeHead(200, {"Content-Type": "image/png"});
                        res.end(data, "binary");
                    });
                }
                else if (row.type == "videos") {
                    thumbnails.getVideoThumbnail(filePath, function(data) {
                        res.writeHead(200, {"Content-Type": "image/png"});
                        res.end(data, "binary");
                    })
                }
            }
        }
    )
});

module.exports = router;
