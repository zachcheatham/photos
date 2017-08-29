const router = require("express").Router();

router.get("/:filename", function(req, res) {
    const filename = req.params.filename;

    req.db.query(`
        SELECT * FROM \`photos\`
        LEFT JOIN \`photos_metadata\` ON \`photos\`.\`filename\` = \`photos_metadata\`.\`filename\`
        WHERE \`photos\`.\`filename\` = ?`,
        [filename],
        function(error, results, fields) {
            if (error) {
                res.statusCode = 500;
                res.json({"success": false, "filename": filename, "error": "database_error", "error_extra": error.code});
            }
            else {
                var exists = results.length > 0;
                if (!exists) {
                    res.statusCode = 404;
                    res.json({"success": false, "filename": filename, "error": "not_found"});
                }
                else if (results[0].latitude) {
                    const lat = Math.round(results[0].latitude * 100) / 100;
                    const long = Math.round(results[0].longitude * 100) / 100;
                    req.db.query(
                        "SELECT `location` FROM `geodecode_cache` WHERE `lat` = ? AND `lon` = ?",
                        [lat, long],
                        function(error, geoResults, fields) {
                            if (geoResults && geoResults.length > 0) {
                                results[0].geodecoded = geoResults[0].location;
                            }

                            res.json({"success": true, "filename": filename, "photo": results[0]});
                        }
                    );
                }
                else {
                    res.json({"success": true, "filename": filename, "photo": results[0]});
                }
            }
        }
    );
});

module.exports = router;
