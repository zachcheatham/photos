const debug = process.env.NODE_ENV !== "production";
const webpack = require("webpack");
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const plugins = [
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: Infinity,
        filename: 'vendor.bundle.js'
    }),
    new HtmlWebpackPlugin({
        template: __dirname + '/src/client/index.ejs',
        production: !debug,
        inject: true,
    }),
]

if (!debug) {
    plugins.push(
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({mangle: false, sourcemap: false})
    )

    jsEntry.unshift(
        'webpack-dev-server/client?http://localhost:8080',
        'webpack/hot/only-dev-server'
    );
}

module.exports = {
    context: __dirname + "/src/client",
    devtool: debug ? "inline-sourcemap" : null,
    entry: {
        js: ["./js/app"],
        vendor: [
            "axios",
            "leaflet/dist/leaflet.css",
            "material-ui/Avatar",
            "material-ui/AppBar",
            "material-ui/Button",
            "material-ui/colors",
            "material-ui/Dialog",
            "material-ui/Divider",
            "material-ui/Grid",
            "material-ui/GridList",
            "material-ui/IconButton",
            "material-ui/internal/Modal",
            "material-ui/List",
            "material-ui/Menu",
            "material-ui/Paper",
            "material-ui/Progress",
            "material-ui/styles",
            "material-ui/TextField",
            "material-ui/Toolbar",
            "material-ui/Typography",
            "material-ui-icons/ArrowBack",
            "material-ui-icons/Cached",
            "material-ui-icons/Camera",
            "material-ui-icons/Check",
            "material-ui-icons/CloudOff",
            "material-ui-icons/Close",
            "material-ui-icons/CompareArrows",
            "material-ui-icons/ErrorOutline",
            "material-ui-icons/FileDownload",
            "material-ui-icons/Image",
            "material-ui-icons/Info",
            "material-ui-icons/InsertInvitation",
            "material-ui-icons/KeyboardArrowDown",
            "material-ui-icons/Lens",
            "material-ui-icons/LocationOn",
            "material-ui-icons/MoreVert",
            "material-ui-icons/ModeEdit",
            "material-ui-icons/RotateRight",
            "material-ui-icons/ZoomOut",
            "moment",
            "moment-timezone",
            "moment-duration-format",
            "react",
            "react-dom",
            "react-jss",
            "react-leaflet",
            "react-resize-aware",
            "react-router-dom",
            "react-router-dom/BrowserRouter"
        ],
    },
    module: {
        loaders: [
            {
                test: /\.js?$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
                query: {
                    presets: ["react", "es2015", "stage-0"],
                    plugins: [
                        "react-html-attrs",
                        "transform-class-properties",
                        "transform-decorators-legacy"
                    ]
                }
            },
            {test: /\.(css)?$/, loader: "style-loader!css-loader"},
            {test: /\.(png|woff|woff2|eot|ttf|svg|jpg|webp)$/, loader: "file-loader"}
        ]
    },
    output: {
        path: __dirname + "/static",
        filename: "bundle.js",
        publicPath: "/"
    },
    plugins: plugins,
    devServer: {
        historyApiFallback: {
            disableDotRule: true
        }
    }
};
