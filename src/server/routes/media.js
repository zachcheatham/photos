const router = require("express").Router();

router.get("/:filename", function(req, res) {
    req.db.query(`SELECT
        \`year\`,
        \`album\`,
        \`type\`
    FROM
    (
        SELECT \`year\`, \`album\`, "videos" as \`type\` FROM \`videos\` WHERE \`filename\` = ?
        UNION ALL
        SELECT \`year\`, \`album\`, "photos" as \`type\` FROM \`photos\` WHERE \`filename\` = ?
    ) \`media\`
    LIMIT 1`,
    [req.params.filename, req.params.filename],
    function(error, results, fields) {
        if (error) {
            res.status(500).send("Database Error: " + error.code);
        }
        else {
            if (results.length == 0) {
                res.status(404).end();
            }
            else {
                const rootPath = `./content/${results[0].type}/${results[0].year}/${results[0].album}/`;
                res.sendFile(req.params.filename, {root: rootPath});
            }
        }
    });
});

module.exports = router;
