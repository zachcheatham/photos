const router = require("express").Router();

const ITEMS_PER_PAGE=50

router.get("/:page", function(req, res) {
    const offset = ITEMS_PER_PAGE * (req.params.page - 1)

    req.db.all(`
        SELECT "photo" as type, filename, added_timestamp, NULL as length
        FROM photos
        
        UNION ALL
        
        SELECT "video" as type, filename, added_timestamp, length
        FROM videos
        
        ORDER BY added_timestamp DESC
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset};`,
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
            res.json({"success": true, "photos": rows});
        }
    });
});

module.exports = router;
