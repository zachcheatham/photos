const router = require("express").Router();
const Constants = require("../helpers/constants");

router.get("/:filename", function(req, res) {
    req.db.get(`
        SELECT
            year,
            album,
            type
        FROM
        (
            SELECT year, album, "videos" as type FROM videos WHERE filename = ?
            UNION ALL
            SELECT year, album, "photos" as type FROM photos WHERE filename = ?
        ) media
        LIMIT 1`,
        [req.params.filename, req.params.filename],
        function(error, row) {
            if (error) {
                res.status(500).send("Database Error: " + error.code);
            }
            else {
                if (!row) {
                    res.status(404).end();
                }
                else {
                    var pathRoot = "";
                    if (row.type == "photos")
                        pathRoot = Constants.PHOTOS_DIR;
                    else
                        pathRoot = Constants.VIDEOS_DIR;

                    const rootPath = `${pathRoot}/${row.year}/${row.album}/`;
                    res.sendFile(req.params.filename, {root: rootPath});
                }
            }
        });
});

module.exports = router;
