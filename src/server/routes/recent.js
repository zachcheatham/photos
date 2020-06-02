const router = require("express").Router();

router.get("/", function(req, res) {
    req.db.all(`
        SELECT "photo" as type, filename, added_timestamp, NULL as length
        FROM photos
        
        UNION ALL
        
        SELECT "video" as type, filename, added_timestamp, length
        FROM videos
        
        ORDER BY added_timestamp
        DESC LIMIT 50;`,
    function(err, rows) {
        if (err) {
            res.statusCode = 500;
            res.json({
                "success": false,
                "error": "database_error",
                "error_extra": err.code
            });
        }
        else {
            res.json({"*": true, "photos": rows});
        }
    });
});

module.exports = router;
