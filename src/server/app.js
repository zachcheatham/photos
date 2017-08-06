const PORT = 3000;
const express = require("express")
const app = express();
const database = require("./database.js");

// Include database
app.use(function(req, res, next) {
    req.db = database;
    next();
});

app.use("/api/years", require("./routes/years"));
app.use("/api/albums", require("./routes/albums"));
app.use("/api/photos", require("./routes/photos"));
app.use("/api/update-index", require("./routes/update-index"));

app.listen(PORT, (err) => {
    if (err)
        console.log(err);
    else {
        console.log("Photo Browser Server 1.0.0.");
        console.log("Server Started.")
    }
});

module.exports = app;
