const { mergeWithRules, CustomizeRule } = require('webpack-merge')
const path = require('path')

const common = require('./webpack.common.js')

const develop = {
    mode: 'development',
    devtool: 'source-map',
    devServer: {
        static: path.resolve(__dirname, 'dist'),
        https: false,
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: 'all',
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
    },
}

const mergePattern = {
    module: {
        rules: {
            test: CustomizeRule.Match,
            exclude: CustomizeRule.Match,
            use: {
                loader: CustomizeRule.Match,
                options: CustomizeRule.Replace,
            },
        },
    },
}

module.exports = mergeWithRules(mergePattern)(common, develop)
