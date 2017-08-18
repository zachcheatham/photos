const router = require("express").Router();
const fs = require("fs");
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
        req.db.query(
            "SELECT COUNT(*) as `c` FROM `albums` WHERE `year` = ? AND `album` = ?",
            [year, album],
            function(error, results, fields) {
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
                else {
                    var exists = results[0].c > 0;
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
                        req.db.query(`
                            SELECT
                                \`filename\`,
                                \`type\`
                            FROM
                            (
                                SELECT \`filename\`, "videos" as \`type\` FROM \`videos\` WHERE \`album\` = ? AND \`year\` = ?
                                UNION ALL
                                SELECT \`filename\`, "photos" as \`type\` FROM \`photos\` WHERE \`album\` = ? AND \`year\` = ?
                            ) \`media\`
                            ORDER BY RAND()
                            LIMIT 1`,
                            [album, year, album, year],
                            function(error, results, fields) {
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
                                else if (results.length == 0) {
                                    res.statusCode = 404;
                                    res.json({
                                        "success": false,
                                        "year": year,
                                        "album": album,
                                        "error": "empty_album"
                                    });
                                }
                                else {
                                    var result = results[0];
                                    var filePath = `./content/${result.type}/${year}/${album}/${result.filename}`;
                                    if (result.type == "photos") {
                                        thumbnails.getPhotoThumbnail(filePath, function(data) {
                                            res.writeHead(200, {"Content-Type": "image/png"});
                                            res.end(data, "binary");
                                        });
                                    }
                                    else if (result.type == "videos") {
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

    req.db.query(`
        SELECT
            \`year\`,
            \`album\`,
            \`type\`
        FROM
        (
            SELECT \`year\`, \`album\`, "videos" as \`type\` FROM \`videos\` WHERE \`filename\` = ?
            UNION ALL
            SELECT \`year\`, \`album\`, "photos" as \`type\` FROM \`photos\` WHERE \`filename\` = ?
        ) \`media\`
        ORDER BY RAND()
        LIMIT 1`,
        [filename, filename],
        function(error, results, fields) {
            if (error) {
                res.statusCode = 500;
                res.json({
                    "success": false,
                    "filename": filename,
                    "error": "database_error",
                    "error_extra": error.code
                });
            }
            else if (results.length == 0) {
                res.statusCode = 404;
                res.json({
                    "success": false,
                    "filename": filename,
                    "error": "not_found"
                });
            }
            else {
                var result = results[0];
                var filePath = `./content/${result.type}/${result.year}/${result.album}/${filename}`;
                if (result.type == "photos") {
                    thumbnails.getPhotoThumbnail(filePath, function(data) {
                        res.writeHead(200, {"Content-Type": "image/png"});
                        res.end(data, "binary");
                    });
                }
                else if (result.type == "videos") {
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
