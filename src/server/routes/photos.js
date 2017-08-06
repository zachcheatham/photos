const router = require("express").Router();

router.get("/:filename", function(req, res) {
    const filename = req.params.filename;

    req.db.query("SELECT * FROM `photos` WHERE `filename` = ?", [filename], function(error, results, fields) {
        if (error) {
            res.statusCode = 500;
            res.json({"success": false, "filename": filename, "error": "database_error", "error_extra": error});
        }
        else {
            var exists = results.length > 0;
            if (!exists) {
                res.statusCode = 404;
                res.json({"success": false, "filename": filename, "error": "not_found"});
            }
            else {
                res.json({"success": true, "filename": filename, "photo": results[0]});
            }
        }
    });
});

router.get("/:filename/exif", function(req, res) {
    const ExifImage = require("exif").ExifImage;

    const filename = req.params.filename;

    req.db.query("SELECT * FROM `photos` WHERE `filename` = ?", [filename], function(error, results, fields) {
        if (error) {
            res.statusCode = 500;
            res.json({"success": false, "filename": filename, "error": "database_error", "error_extra": error});
        }
        else {
            var exists = results.length > 0;
            if (!exists) {
                res.statusCode = 404;
                res.json({"success": false, "filename": filename, "error": "not_found"});
            }
            else {
                var filePath = "./content/photos/" + results[0].year + "/" + results[0].album + "/" + results[0].filename;
                console.log(filePath)

                try {
                    new ExifImage({image: filePath}, function(error, exifData) {
                        if (error) {
                            console.log(error);
                            res.statusCode = 500;
                            res.json({"success": false, "filename": filename, "error": "exif_error", "error_extra": error});
                        }
                        else {
                            res.json({"success": true, "filename": filename, "exif_data": exifData});
                        }
                    });
                }
                catch (error) {
                    res.statusCode = 500;
                    res.json({"success": false, "filename": filename, "error": "exif_error", "error_extra": error.message});
                }
            }
        }
    });
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
        req.db.query("SELECT COUNT(*) as `c` FROM `albums` WHERE `year` = ? AND `album` = ?", [year, album], function(error, results, fields) {
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
                    req.db.query("SELECT `filename`, `time_taken` FROM `photos` WHERE `year` = ? AND `album` = ? ORDER BY `time_taken` ASC", [year, album], function(error, results, fields) {
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
                            res.json({"success": true, "year": year, "album": album, "photos": results});
                        }
                    });
                }
            }
        });
    }
});

module.exports = router;
