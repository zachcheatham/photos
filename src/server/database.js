var mysql = require("mysql");
var connection = mysql.createConnection({
    host: "192.168.1.5",
    user: "photos",
    password: "Uc{3yDcU@a6Mw85M",
    database: "photos"
});

module.exports = connection;
