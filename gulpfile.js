var gulp = require('gulp'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    watch = require('gulp-watch'),
    batch = require('gulp-batch'),
    watchify = require('watchify'),
    util = require('gulp-util'),
    _ = require('lodash');

/**
 * @type {Object}
 */
var paths = {
    js: 'src/js/**/*.js',
    js_entry: 'src/js/index.js'
};

/**
 * @param {Object} error
 */
var handleError = function (error) {
    util.log(
        '\n\n',
         util.colors.red(error.message),
        '\n\nin: ' + error.filename + ' (' + error.pos + ')\n\n',
        error.codeFrame + '\n\n'
    );

    this.emit('end');
};

/**
 * @param {Boolean} doWatch
 * @param {Function} onFinishedCallback
 */
var build = function (doWatch, onFinishedCallback) {
    util.log(' --> building..');

    var bundler = browserify({
        entries: paths.js_entry,
        extensions: ['.js'],
        exclude: ['node_modules', 'bower_components'],
        cache: {},
        packageCache: {},
        debug: true
    });

    if (doWatch) {
        // use watchify instead of gulp.watch because it is quite a lost faster!!
        bundler = watchify(bundler);
    }

    transformCode(bundler);

    bundler.on('update', function () {
        transformCode(bundler);

        bundle(bundler, null);
    });

    return bundle(bundler, onFinishedCallback);
};

/**
 * @param {Object} bundler
 * @param {Function} onFinishedCallback
 *
 * @returns {Object}
 */
var bundle = function (bundler, onFinishedCallback) {
    util.log(' --> bundling..');

    var stream = bundler.bundle();

    // handle events, as the streaming is asynchronous we want some feedback about
    // the progress
    stream
        .on('error', handleError)
        .on('end', function () {
            util.log(' --> done..\n');
            util.log(util.colors.green('-----------------------') + '\n');

            if (_.isFunction(onFinishedCallback)) {
                onFinishedCallback();
            }
        });

    // bundle files in bundle.js in build folder
    stream
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('build/js'));

    return stream;
};

/**
 * @param {Object} bundler
 *
 * @return {Object}
 */
var transformCode = function (bundler) {
    util.log(' --> transforming..');

    bundler
        .transform(babelify, {
            presets: ['es2015', 'react']
        });

    return bundler;
};

/**
 * Takes javascript, convers ECMA5 and React code to general and supported javascript,
 * and bundles it in one file
 */
gulp.task('build', function (cb) {
    build(false, cb);
});

/**
 * Watches for changes and rebuilds when one is detected
 */
gulp.task('watch', function (cb) {
    build(true);
});

gulp.task('default', ['build']);
