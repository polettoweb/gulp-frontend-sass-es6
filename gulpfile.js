// REQUIRE PACKAGES
/** For Gulp workflow **/
let gulp = require('gulp');
let runSequence = require('run-sequence');
let clean = require('gulp-clean');
let bs = require('browser-sync').create();
let strip = require('gulp-strip-comments');
let stripDebug = require('gulp-config-strip-debug');
let noop = require('gulp-noop');
let util = require('gulp-util');

/** For HTML **/
//json minify for production
let jsonminify = require('gulp-json-minify');
//html minify for production
let htmlmin = require('gulp-htmlmin');

/** For Css **/
//compiling sass to css
let sass = require('gulp-sass');
//clean and minify css for production
let cleanCSS = require('gulp-clean-css');
//creation of sourcemaps in dev environment
let sourcemaps = require('gulp-sourcemaps');
//PostCSS automatic prefix, px to rem, fallback, sprite, etc
let postcss = require('gulp-postcss');
//cssnext is a pack of postcss plugins. it comprhends a lot of workers. Define custom rule in "processors" let
let cssnext = require('postcss-cssnext');
//automatic conversion from PX to REM - Use "propWhiteList" to add element in white list -> [] = all
let pxtorem = require('postcss-pxtorem');
// use a single SVG file and gives ID inside the svg code. use syntax filename.ext#id to call the as background
let svg = require('postcss-svg');

// For Js
let babel = require("gulp-babel");
let uglify = require("gulp-uglify");
let concat = require("gulp-concat");

// For Images
let imagemin = require('gulp-imagemin');

// Define I/O paths
let path = {
    css: {
        i: './src/scss/**/*.scss',
        o: './dist/css/'
    },
    fonts: {
        i: './src/fonts/**/*',
        o: './dist/css/fonts'
    },
    html: {
        i: './src/**/*.html',
        o: './dist/'
    },
    js: {
        i: './src/js/**/*.js',
        o: './dist/js'
    },
    img: {
        i: './src/img/**/*',
        o: './dist/img'
    },
    data: {
        i: './src/data/**/*.json',
        o: './dist/data'
    },
    include: {
        i: './src/include/**/*',
        o: './dist/include'
    }
};

// Define SASS options
let sassOptions = {
    errLogToConsole: true,
    outputStyle: 'expanded'
};
/** Env var. Checking dev / prod flag */
let config = {
        production: !!util.env.production
    };
//post css used plugins: autoprefix, px to rem, svg sprite
let processors = [
    cssnext,
    pxtorem({
        propWhiteList: []
    }),
    svg,
];

/** TASKS **/

/** DEFAULT "gulp" on terminal */
gulp.task('default', function(callback) {
    sassOptions = {
        errLogToConsole: true,
        outputStyle: 'expanded'
    };
    runSequence('sass', 'html', 'js', 'img', 'data', 'includejs', 'includecss', callback)
});

// Watching for changes on any project folder
gulp.task('watch', function() {
        runSequence('clean:dist', 'default', function() {
            bs.init({ server: "dist" });
            gulp.watch(path.js.i, ['js']);
            gulp.watch(path.css.i, ['sass']);
            gulp.watch(path.html.i, ['html']);
            gulp.watch(path.img.i, ['img']);
            gulp.watch(path.data.i, ['data']);
            gulp.watch(path.include.i, ['includejs','includecss']);
        })

});
/** Bundle everything up ready for dropping onto the server
 Destroy comments, remove console.logging, minify **/
gulp.task('prod', function() {
    console.log('Production build STARTED');
    config.production = true;
    sassOptions = {
        errLogToConsole: false,
        outputStyle: 'compressed'
    };
    runSequence('clean:dist', 'sass', 'html', 'js', 'img', 'data', 'includejs','includecss', () => {
        console.log('Production build FINISHED!!!!');
    })
});
//
// // Delete the distribution folder
gulp.task('clean:dist', function() {
    return gulp.src('./dist', { read: false })
        .pipe(clean())
});
//
// HTML files
gulp.task('html', function() {
    gulp.src([path.html.i])
        .pipe((config.production) ? htmlmin({collapseWhitespace: true}) : noop())
        .pipe(gulp.dest(path.html.o))
        .pipe(bs.stream())
});
//
// Images
gulp.task('img', function() {
    gulp.src([path.img.i])
        .pipe((config.production) ? imagemin({ progressive: true }) : noop())
        .pipe(gulp.dest(path.img.o))
        .pipe(bs.stream())

});
//
// Data files
gulp.task('data', function() {
    gulp.src([path.data.i])
        .pipe((config.production) ? jsonminify() : noop())
        .pipe(gulp.dest(path.js.o))
        .pipe(bs.stream())
});
//
// 3rd party plugins - splitting JS from CSS files and putting them in the right dest folder
gulp.task('includejs', function() {
        gulp.src('./src/include/*.js')
            .pipe(gulp.dest(path.js.o))
            .pipe(config.production ? uglify() : noop())
            .pipe(bs.stream())
    });
gulp.task('includecss', function() {
    gulp.src('./src/include/*.css')
        .pipe(gulp.dest(path.css.o))
        .pipe(config.production ? cleanCSS() : util.noop())
        .pipe(bs.stream())
});
//fonts
gulp.task('fonts', function() {
    gulp.src(path.fonts.i)
        .pipe(gulp.dest(path.fonts.o))
        .pipe(bs.stream())
});  
// Scss
gulp.task('sass', function() {
    gulp.src(path.css.i)
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(config.production ? cleanCSS() : util.noop())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.css.o))
        .pipe(bs.stream())
    });
//     // Javascript
gulp.task('js', function() {
    gulp.src(path.js.i)
        .pipe(sourcemaps.init())
        .pipe(concat('app.js'))
        .pipe(babel({ presets: ['es2015'], minified: config.production }))
        .pipe(config.production ? stripDebug() : noop())
        .pipe(config.production ? strip() : noop())
        .pipe(config.production ? uglify() : noop())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.js.o))
        .pipe(bs.stream())
});