const router = require("express").Router();
const dns = require("dns");

var recordLog = function(req, filename, key, value) {
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7);
    }
    dns.reverse(ip, function(err, domains) {
        var hostname = null;
        if (!err) {
            hostname = domains[0];
        }

        req.db.query(`
            INSERT INTO \`edit_log\`
            (\`filename\`, \`key\`, \`value\`, \`ip\`, \`hostname\`, \`timestamp\`)
            VALUES(?, ?, ?, ?, ?, ?)`,
            [
                filename,
                key,
                value,
                ip,
                hostname,
                (Math.floor(Date.now() / 1000))
            ]
        );
    });
}

router.get("/rotate/:filename/:degrees", function(req, res) {
    const degrees = parseInt(req.params.degrees);
    const filename = req.params.filename;

    if (!isNaN(degrees)) {
        req.db.query(
            "UPDATE `photos` SET `rotation` = ? WHERE `filename` = ?",
            [degrees, filename],
            function(error, results, fields) {
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

                    recordLog(req, filename, "rotation", degrees);
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

module.exports = router;
