const debug = process.env.NODE_ENV !== "production";
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const minimizer = [];

if (!debug) {
    minimizer.push(
        new TerserPlugin({
            terserOptions: {
                mangle: true
            },
            sourceMap: false
        })
    );
}

module.exports = {
    context: __dirname + "/src/client",
    devtool: debug ? "inline-sourcemap" : false,
    entry: "./app.js",
    optimization: {
        minimize: (!debug),
        minimizer: minimizer,
        splitChunks: {
            chunks: 'all'
        }
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /(node_modules|bower_components)/,
                loader: "babel-loader",
                query: {
                    presets: ["@babel/react", "@babel/env"],
                    plugins: [
                        "react-html-attrs",
                        "transform-class-properties"
                    ]
                }
            },
            {
                test: /\.html?$/,
                exclude: /node_modules/,
                use: {
                    loader: "html-loader",
                    options: {minimize: true}
                }
            },
            {test: /\.(png|woff|woff2|eot|ttf|svg|jpg|webp)$/, loader: "file-loader"},
            {test: /\.css$/, loader: "style-loader!css-loader"},
            {test: /\.scss$/, use: [
                {loader: "style-loader"},
                {
                    loader: 'css-loader',
                    options: {
                        modules: {
                            localIdentName: '[hash:base64:5][path]-[local]'
                        }
                    }
                },
                {loader: "sass-loader"}
            ]}
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: __dirname + '/src/client/index.html',
            production: !debug,
            inject: true,
        }),
    ],
    output: {
        path: __dirname + "/static",
        filename: "bundle.js",
        publicPath: "/"
    },
    devServer: {
        historyApiFallback: {
            disableDotRule: true
        }
    }
};
