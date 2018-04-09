const path = require('path');
const webpack = require("webpack");
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    plugins: [
        new CleanWebpackPlugin(['dist'])
    ],
    optimization: {
        minimize: false
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'angular-dragdrop.js',
        libraryTarget: 'umd',
        globalObject: 'this',
        libraryExport: 'angular-dragdrop'
    },
    externals: {
        'angular': {
            commonjs: 'angular',
            commonjs2: 'angular',
            amd: 'angular',
            root: '_'
        }
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /(node_modules)/,
                use: 'babel-loader'
            }
        ]
    }
};