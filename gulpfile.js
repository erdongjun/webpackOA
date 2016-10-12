  /**
 * @Author: sunshaocheng
 * @Date:   2016-07-26
 * @Last Modified by:   sunshaocheng
 * @Last Modified time: 2016-07-26
 */

// Load plugins
var gulp          = require('gulp'),
    webserver     = require('gulp-webserver'),   //静态服务器
    gutil         = require('gulp-util'),
    webpack       = require('webpack'),
    webpackConfig = require('./webpack.config.js');

// 注册任务
gulp.task('webserver', function() {
  gulp.src( './build/' ) // 服务器目录（./代表根目录）
  .pipe(webserver({ // 运行gulp-webserver
    open: true // 服务器启动时自动打开网页
  }));
});

gulp.task('fonts-copy',  function() {
    gulp.src("./src/fonts/*.*")
        .pipe(gulp.dest("./build/fonts/"));
});

gulp.task('img-copy',  function() {
    gulp.src("./src/img/*.*")
        .pipe(gulp.dest("./build/img/"));
});

gulp.task('build-dev', ['webpack:build-dev'],  function() {
    gulp.watch(["src/**/*"], ["webpack:build-dev"]);
});

gulp.task('webpack:build-dev', function (callback) {
    var myDevConfig = Object.create(webpackConfig);
    var devCompiler = webpack(myDevConfig);

    // run webpack
    devCompiler.run(function (err, stats) {
        if (err) throw new gutil.PluginError('webpack:build-dev', err);
        gutil.log('[webpack:build-dev]', stats.toString({
            colors: true
        }));
        callback();
    });
});

// 生产环境编译
gulp.task('build', ['webpack:build']);

gulp.task('webpack:build', function(callback) {
    var myConfig = Object.create(webpackConfig);

    myConfig.plugins = myConfig.plugins.concat(
        new webpack.DefinePlugin({
            "process.env": {
                "NODE_ENV": JSON.stringify("production")
            }
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin()
    );

    // run webpack
    webpack(myConfig, function (err, stats) {
        if (err) throw new gutil.PluginError("webpack:build", err);
        gutil.log("[webpack:build]", stats.toString({
            colors: true
        }));
        callback();
    });
});

// Default task
gulp.task('default', ['build-dev']);
