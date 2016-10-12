/**
 * @Author: sunshaocheng
 * @Date:   2016-07-26
 * @Last Modified by:   sunshaocheng
 * @Last Modified time: 2016-07-26
 */

'use strict';

var path = require('path');

var webpack = require('webpack');
var glob = require('glob');

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;

var srcDir = path.resolve(process.cwd(), 'src');
var build = path.resolve(process.cwd(), 'build');
var nodeModPath = path.resolve(__dirname, './node_modules');

var entries = (function() {
    var jsDir = path.resolve(srcDir, 'js');
    var entryFiles = glob.sync(jsDir + '/job/*.{js,jsx}');
    var map = {};

    entryFiles.forEach(function(filePath, index) {
        var filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
        map[filename] = filePath;
    });

    return map;
})();
//var chunks = Object.keys(entries);
var config = require('./src/js/lib/config');

module.exports = (function() {
    // 这里publicPath要使用绝对路径，不然scss/css最终生成的css图片引用路径是错误的，应该是scss-loader的bug
    var publicPath = '/';
    var extractCSS,
        cssLoader,
        sassLoader;

    // generate entry html files
    // 自动生成入口文件，入口js名必须和入口文件名相同
    // 例如，a页的入口文件是a.html，那么在js目录下必须有一个a.js作为入口文件
    var plugins = (function() {
        var entryHtml = glob.sync(srcDir + '/html/*.{html,ejs}');
        var r = [];

        entryHtml.forEach(function(filePath, index) {
            var filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
            var conf = {
                // template: 'html-withimg-loader!' + filePath,
                template: filePath,
                filename: filename + '.html'
            };

            if (filename in entries) {
                conf.inject = 'body';
                conf.chunks = ['vendor', filename];
            }

            r.push(new HtmlWebpackPlugin(conf));
        });

        return r;
    })();

    plugins.push(
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        })
    );

    if(config.debug) {
        extractCSS = new ExtractTextPlugin('css/[name].css?[contenthash]');
        cssLoader = extractCSS.extract(['css']);
        sassLoader = extractCSS.extract(['css', 'sass']);
        plugins.push(extractCSS);
    }
    else {
        extractCSS = new ExtractTextPlugin('css/[contenthash:8].[name].min.css', {
            // 当allChunks指定为false时，css loader必须指定怎么处理
            // additional chunk所依赖的css，即指定`ExtractTextPlugin.extract()`
            // 第一个参数`notExtractLoader`，一般是使用style-loader
            // @see https://github.com/webpack/extract-text-webpack-plugin
            allChunks: false
        });
        cssLoader = extractCSS.extract(['css?minimize']);
        sassLoader = extractCSS.extract(['css?minimize', 'sass']);

        plugins.push(
            extractCSS,
            new UglifyJsPlugin({
                compress: {
                    warnings: false
                },
                output: {
                    comments: false
                },
                mangle: {
                    except: ['$', 'exports', 'require']
                }
            }),
            new webpack.optimize.DedupePlugin(),
            new webpack.NoErrorsPlugin()
        );

        plugins.push(new UglifyJsPlugin());
    }

    var configParams = {
        entry: Object.assign(entries, {
            // 用到什么公共lib（例如React.js），就把它加进vendor去，目的是将公用库单独提取打包
           'vendor': ['jQuery']
        }),

        output: {
            path: build,
            filename: config.debug ? 'js/[name].js' : 'js/[chunkhash:8].[name].min.js',
            chunkFilename: config.debug ? 'js/[chunkhash:8].chunk.js' : 'js/[chunkhash:8].chunk.min.js',
            publicPath: config.debug ? publicPath : (config.debugEnv ? 'http://m.lajin.com/live-test/' : 'http://m.lajin.com/live/')
        },

        resolve: {
            root: [srcDir, nodeModPath],
            alias: {
                'jquery': path.join(nodeModPath, '/jquery/dist/jquery.min.js')
            },
            extensions: ['', '.js', '.css', '.scss', '.tpl', '.png', 'jpg']
        },

        module: {
            loaders: [
                {
                    test: /\.((woff2?|svg)(\?v=[0-9]\.[0-9]\.[0-9]))|(woff2?|svg|jpe?g|png|gif|ico|webp)$/,
                    loaders: [
                        // url-loader更好用，小于10KB的图片会自动转成dataUrl，
                        // 否则则调用file-loader，参数直接传入
                        'url?limit=10000&name=img/[hash:8].[name].[ext]',
                        'image?{bypassOnDebug:true, progressive:true, optimizationLevel:4, pngquant:{quality:"80",speed:4}}'
                    ]
                },
                {
                    test: /\.((ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9]))|(ttf|eot)$/,
                    loader: 'url?limit=10000&name=fonts/[hash:8].[name].[ext]'
                },
                {test: /\.(tpl|ejs)$/, loader: 'ejs-compiled'},
                {test: /\.css$/, loader: cssLoader},
                {test: /\.scss$/, loader: sassLoader}
            ]
        },

        plugins: [
            new CommonsChunkPlugin({
                name: 'vendor',
                chunks: ['common']
            })
        ].concat(plugins)
    };

    return configParams;
})();
