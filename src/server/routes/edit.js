const router = require("express").Router();

router.get("/rotate/:filename/:degrees", function(req, res) {
    const degrees = parseInt(req.params.degrees);
    const filename = req.params.filename;

    if (!isNaN(degrees)) {
        req.db.run(
            "UPDATE photos SET rotation = ? WHERE filename = ?",
            [degrees, filename],
            function(error) {
                if (error) {
                    res.statusCode = 500;
                    res.json({
                        "success": false,
                        "filename": filename,
                        "degrees": req.params.degrees,
                        "error": "database_error",
                        "error_extra": error.code
                    });
                }
                else {
                    res.json({
                        "success": true,
                        "filename": filename,
                        "degrees": degrees,
                    });
                }
            }
        );
    }
    else {
        res.statusCode = 400;
        res.json({
            "success": false,
            "filename": filename,
            "degrees": req.params.degrees,
            "error": "invalid_degrees"
        });
    }
});

router.post("/description/:filename/", function(req, res) {
    if (req.body.description !== undefined) {
        var description = req.body.description;
        if (description.length == 0) {
            description = null;
        }

        req.db.get(`
            SELECT 'photos' as type
            FROM photos
            WHERE filename = $file
            UNION ALL
            SELECT 'videos' as type
            FROM videos
            WHERE filename = $file
        `, {$file: req.params.filename}, function(error, row) {
            if (error) {
                res.statusCode = 500;
                res.json({
                    "success": false,
                    "filename": req.params.filename,
                    "description": description,
                    "error": "database_error",
                    "error_extra": error.code
                });
            }
            else if (!row) {
                res.statusCode = 404;
                res.json({
                    "success": false,
                    "filename": req.params.filename,
                    "description": description,
                    "error": "not_found"
                });
            }
            else {
                req.db.run(`
                    UPDATE ${row.type}
                    SET comment = ?
                    WHERE filename = ?;`,
                [description, req.params.filename],
                function(error) {
                    if (error) {
                        res.statusCode = 500;
                        res.json({
                            "success": false,
                            "filename": req.params.filename,
                            "description": description,
                            "error": "database_error",
                            "error_extra": error.code
                        });
                    }
                    else {
                        res.json({
                            "success": true,
                            "filename": req.params.filename,
                            "description": description
                        });
                    }
                });
            }
        });
    }
    else {
        res.statusCode = 400;
        res.json({
            "success": false,
            "filename": req.params.filename,
            "description": req.body.description,
            "error": "invalid_description"
        });
    }
});

module.exports = router;
