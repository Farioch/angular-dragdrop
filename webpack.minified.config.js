const path = require('path');
const webpack = require("webpack");

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    optimization: {
        minimize: true
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'angular-dragdrop.min.js',
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
