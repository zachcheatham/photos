const router = require("express").Router();

router.get("/:year", function(req, res) {
    if (isNaN(parseInt(req.params.year))) {
        res.statusCode = 400;
        res.json({"success": false, "year": req.params.year, "error": "invalid_year"});
    }
    else {
        const year = req.params.year;

        req.db.query("SELECT COUNT(*) as `c` FROM `years` WHERE `year` = ?", [year], function(error, results, fields) {
            if (error) {
                res.statusCode = 500;
                res.json({"success": false, "year": year, "error": "database_error", "error_extra": error.code});
            }
            else {
                var exists = results[0].c > 0;
                if (!exists) {
                    res.statusCode = 404;
                    res.json({"success": false, "year": year, "error": "not_found"});
                }
                else {
                    req.db.query("SELECT `album`, `photos`, `time_start`, `time_end` FROM `albums` WHERE `year` = ? ORDER BY `time_start` ASC", [year], function(error, results, fields) {
                        if (error) {
                            res.statusCode = 500;
                            res.json({"success": false, "year": year, "error": "database_error", "error_extra": error.code});
                        }
                        else {
                            res.json({"success": true, "year": year, "albums": results});
                        }
                    });
                }
            }
        });
    }
});

module.exports = router;
