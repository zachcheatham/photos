const router = require("express").Router();

router.get("/:filename", function(req, res) {
    const filename = req.params.filename;

    req.db.get(`
        SELECT
            "photo" as type,
            timestamp,
            suspect_time,
            width,
            height,
            NULL as length,
            rotation,
            comment,
            filesize,
            NULL as format,
            NULL as video_codec,
            NULL as pixel_format,
            NULL as framerate,
            NULL as scanning_method,
            NULL as audio_codec,
            NULL as audio_channels,
            NULL as audio_channel_layout,
            NULL as audio_sample_rate,
            NULL as audio_bitrate,
            make,
            model,
            lens_model,
            fnumber,
            exposure_time,
            focal_length,
            iso,
            latitude,
            longitude,
            direction
        FROM
            photos
        WHERE
            photos.filename = $file

        UNION ALL

        SELECT
            "video" as type,
            timestamp,
            suspect_time,
            width,
            height,
            length,
            NULL as rotation,
            comment,
            filesize,
            format,
            video_codec,
            pixel_format,
            framerate,
            scanning_method,
            audio_codec,
            audio_channels,
            audio_channel_layout,
            audio_sample_rate,
            audio_bitrate,
            NULL as make,
            NULL as model,
            NULL as lens_model,
            NULL as fnumber,
            NULL as exposure_time,
            NULL as focal_length,
            NULL as iso,
            NULL as latitude,
            NULL as longitude,
            NULL as direction
        FROM videos
        WHERE
            videos.filename = $file`,
        {$file: filename},
        function(error, row) {
            if (error) {
                res.statusCode = 500;
                res.json({"success": false, "filename": filename, "error": "database_error", "error_extra": error.code});
            }
            else {
                if (!row) {
                    res.statusCode = 404;
                    res.json({"success": false, "filename": filename, "error": "not_found"});
                }
                else {
                    // Remove null values
                    const cleanResults = {};
                    for (var key in row) {
                        if (row[key] !== null) {
                            cleanResults[key] = row[key];
                        }
                    }

                    if (cleanResults.latitude) {
                        const lat = Math.round(cleanResults.latitude * 100) / 100;
                        const long = Math.round(cleanResults.longitude * 100) / 100;
                        req.db.get(
                            "SELECT location FROM geodecode_cache WHERE lat = ? AND lon = ?",
                            [lat, long],
                            function(error, geoRow) {
                                if (geoRow) {
                                    cleanResults.geodecoded = geoRow.location;
                                }

                                res.json({"success": true, "filename": filename, "info": cleanResults});
                            }
                        );
                    }
                    else {
                        res.json({"success": true, "filename": filename, "info": cleanResults});
                    }
                }
            }
        }
    );
});

module.exports = router;
