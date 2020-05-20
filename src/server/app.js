const bodyParser = require("body-parser");
const express = require("express");
const fallback = require("express-history-api-fallback");

const Constants = require("./helpers/constants");
const app = express();
const initDatabase = require("./database.js");

var database = null;

// Include database
app.use("/api/*", function(req, res, next) {
    req.db = database;
    next();
});

app.use("/api/*", bodyParser.json());

app.use("/api/years", require("./routes/years"));
app.use("/api/albums", require("./routes/albums"));
app.use("/api/info", require("./routes/info"));
app.use("/api/geodecode", require("./routes/geodecode"));
app.use("/api/edit", require("./routes/edit"));
app.use("/api/media", require("./routes/media"));
app.use("/api/thumbnail", require("./routes/thumbnail"));
app.use("/api/update-index", require("./routes/update-index"));

app.use(express.static(__dirname + "/../../static"));
app.use(fallback("index.html", {root: __dirname + "/../../static"}));

console.log("Photo Browser Server 1.1.0.");
initDatabase((db) => {

    console.log(`Starting web server on port ${Constants.PORT}...`);

    database = db;

    app.listen(Constants.PORT, (err) => {
        if (err)
            console.log(err);
        else {
            console.log("Server Started.")
        }
    });
});

module.exports = app;
