const router = require("express").Router();

router.get("/", function(req, res) {
    req.db.query("SELECT * FROM `years`ORDER BY `year` ASC", function(error, results, fields) {
        if (error) {
            res.statusCode = 500;
            res.json({"success": false, "error": "database_error", "error_extra": error.code});
        }
        else {
            res.json({"success": true, "years": results});
        }
    });
});

module.exports = router;
