var gulp = require('gulp'),
    browserify = require('browserify'),
    babelify = require('babelify'),
    source = require('vinyl-source-stream'),
    watch = require('gulp-watch'),
    batch = require('gulp-batch'),
    watchify = require('watchify'),
    util = require('gulp-util');

var paths = {
    js: 'src/js/**/*.js',
    js_entry: 'src/js/index.js'
};

/**
 * @param {Error} error
 */
var handleError = function (error) {
    util.log(
        '\n\n',
         util.colors.red(error.message),
        '\n\nin: ' + error.filename + ' (' + error.pos + ')\n\n',
        error.codeFrame + '\n\n'
    );
};

/**
 * @param {Boolean} doWatch
 * @param {Function} cb
 */
var doBuild = function (doWatch, cb) {
    var bundler = browserify({
        entries: paths.js_entry,
        extensions: ['.js'],
        exclude: ['node_modules', 'bower_components'],
        cache: {},
        packageCache: {},
        debug: true
    });

    if (doWatch) {
        // use watchify instead of gulp.watch because it is quite a lost faster!
        bundler = watchify(bundler);
    }

    bundler
        .transform(babelify, {
            presets: ['es2015', 'react']
        });

    var rebundle = function () {
        console.log(' --> detected changes..');
        console.log(' --> building..');

        var stream = bundler.bundle();

        // handle events
        stream
            .on('error', handleError)
            .on('end', function () {
                console.log(' --> done..\n');
                console.log('-----------------------\n');
            });

        // pipe to bundle.js in build folder
        stream
            .pipe(source('bundle.js'))
            .pipe(gulp.dest('build/js'));

        return stream;
    }

    bundler.on('update', rebundle);

    return rebundle();
}

/**
 * Takes javascript, convers ECMA5 and React code to general and supported javascript,
 * and bundles it in one file
 */
gulp.task('build', function (cb) {
    doBuild(false, cb);
});

/**
 * Watches for changes and rebuilds when one is detected
 */
gulp.task('watch', function (cb) {
    doBuild(true, cb);
});

gulp.task('default', ['build']);
