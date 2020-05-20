const router = require("express").Router();
const request = require("request");

router.get("/:coordinates", function(req, res) {
    if (req.params.coordinates.includes(",")) {
        const coordinates = req.params.coordinates.split(',');
        if (coordinates.length > 0) {
            const lat = parseFloat(coordinates[0]);
            const long = parseFloat(coordinates[1]);

            if (!isNaN(lat) && !isNaN(long)) {
                const latRound = Math.round(lat * 100) / 100
                const longRound = Math.round(long * 100) / 100
                req.db.get(
                    "SELECT location FROM geodecode_cache WHERE lat = ? AND lon = ?",
                    [latRound, longRound],
                    function(error, row) {
                        if (row) {
                            res.json({
                                "success": true,
                                "cached": true,
                                "latitude": latRound,
                                "longitude": longRound,
                                "location": row.location
                            });
                        }
                        else {
                            request(
                                {
                                    url: "http://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=" + latRound + "&lon=" + longRound,
                                    headers: {
                                        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:47.0) Gecko/20100101 Firefox/47.0",
                                    }
                                },
                                function(error, response, body) {
                                    if (error) {
                                        res.statusCode = 500;
                                        res.json({
                                            "success": false,
                                            "latitude": latRound,
                                            "longitude": longRound,
                                            "error": "geodecode_request",
                                            "error_extra": error.code,
                                        });
                                    }
                                    else if (response.statusCode != 200) {
                                        res.statusCode = 500;
                                        res.json({
                                            "success": false,
                                            "latitude": latRound,
                                            "longitude": longRound,
                                            "error": "geodecode_request",
                                            "error_extra": response.statusCode,
                                        });
                                    }
                                    else {
                                        const responseJSON = JSON.parse(body);

                                        var location = "";

                                        if (responseJSON.address.city) {
                                            location += responseJSON.address.city;
                                        }
                                        else if (responseJSON.address.hamlet) {
                                            location += responseJSON.address.hamlet;
                                        }

                                        if (responseJSON.address.state) {
                                            if (location.length > 0) {
                                                location += ", ";
                                            }

                                            location += responseJSON.address.state
                                        }

                                        res.json({
                                            "success": true,
                                            "cached": false,
                                            "latitude": latRound,
                                            "longitude": longRound,
                                            "location": location
                                        });

                                        req.db.run(`
                                            INSERT INTO geodecode_cache (
                                                lat, lon, location)
                                            VALUES(?, ?, ?)`,
                                            [latRound, longRound, location]
                                        );
                                    }
                                }
                            )
                        }
                    }
                );
            }
            else {
                res.statusCode = 400;
                res.json({
                    "success": false,
                    "coordinates": req.params.coordinates,
                    "latitude": coordinates[0],
                    "longitude": coordinates[1],
                    "error": "invalid_coordinates"
                });
            }
        }
        else {
            res.statusCode = 400;
            res.json({
                "success": false,
                "coordinates": req.params.coordinates,
                "error": "invalid_coordinates"
            });
        }
    }
    else {
        res.statusCode = 400;
        res.json({
            "success": false,
            "coordinates": req.params.coordinates,
            "error": "invalid_coordinates"
        });
    }
});

module.exports = router;
