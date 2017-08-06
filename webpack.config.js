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
        'webpack-dev-server/client?http://localhost:3000',
        'webpack/hot/only-dev-server'
    );
}

module.exports = {
    context: __dirname + "/src/client",
    devtool: debug ? "inline-sourcemap" : null,
    entry: {
        js: ["./js/client", "./js/pages/home/Home"],
        vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "react-async-component",
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
            {test: /\.less?$/, loader: "style-loader!css-loader!less-loader"},
            {test: /\.(png|woff|woff2|eot|ttf|svg|jpg|webp)$/, loader: "file-loader"}
        ]
    },
    output: {
        path: __dirname + "/static",
        filename: "bundle.js",
        publicPath: "/"
    },
    plugins: plugins,
};
