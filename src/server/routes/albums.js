const router = require("express").Router();

router.get("/:year", function(req, res) {
    if (isNaN(parseInt(req.params.year))) {
        res.statusCode = 400;
        res.json({"success": false, "year": req.params.year, "error": "invalid_year"});
    }
    else {
        const year = req.params.year;

        req.db.get("SELECT COUNT(1) as cnt FROM years WHERE year = ?", year, function(error, row) {
            if (error) {
                res.statusCode = 500;
                res.json({"success": false, "year": year, "error": "database_error", "error_extra": error.code});
            }
            else {
                if (row.cnt < 1) {
                    res.statusCode = 404;
                    res.json({"success": false, "year": year, "error": "not_found"});
                }
                else {
                    req.db.all("SELECT album, photos, time_start, time_end FROM albums WHERE year = ? ORDER BY time_start ASC", year, function(error, rows) {
                        if (error) {
                            res.statusCode = 500;
                            res.json({"success": false, "year": year, "error": "database_error", "error_extra": error.code});
                        }
                        else {
                            res.json({"success": true, "year": year, "albums": rows});
                        }
                    });
                }
            }
        });
    }
});

router.get("/:year/:album", function(req, res) {
    const year = parseInt(req.params.year);
    const album = req.params.album;

    if (isNaN(parseInt(req.params.year))) {
        res.statusCode = 400;
        res.json({
            "success": false,
            "year": year,
            "album": album,
            "error": "invalid_year"
        });
    }
    else {
        req.db.get("SELECT COUNT(*) as cnt FROM albums WHERE year = ? AND album = ?", [year, album], function(error, row) {
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
                if (row.cnt < 1) {
                    res.statusCode = 404;
                    res.json({
                        "success": false,
                        "year": year,
                        "album": album,
                        "error": "not_found"
                    });
                }
                else {
                    req.db.all(`
                        SELECT
                            filename,
                            timestamp,
                            suspect_time,
                            length,
                            type
                        FROM
                        (
                            SELECT
                                filename,
                                timestamp,
                                suspect_time,
                                length,
                                "video" as type
                            FROM videos WHERE album = ? AND year = ?
                            UNION ALL
                            SELECT
                                filename,
                                timestamp,
                                suspect_time,
                                NULL as length,
                                "photo" as type
                            FROM photos WHERE album = ? AND year = ?
                        ) media
                        ORDER BY timestamp ASC`,
                        [album, year, album, year],
                        function(error, rows) {
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
                                res.json({"success": true, "year": year, "album": album, "photos": rows});
                            }
                        }
                    );
                }
            }
        });
    }
});

module.exports = router;
