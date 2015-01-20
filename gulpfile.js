/**
 * Created by gal on 1/17/15.
 */

var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');

gulp.task('buildHtml', function() {
    return gulp.src('src/app/**/*.html')
        .pipe(gulp.dest('public/app'));
});

gulp.task('buildJS', function() {
    return gulp.src('src/app/**/*.js')
        .pipe(concat('colibri.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/app'));
});

gulp.task('buildCSS', function() {
    return gulp.src('src/app/**/*.css')
        .pipe(concat('colibri.min.css'))
        .pipe(minifyCSS({keepBreaks:true}))
        .pipe(gulp.dest('public/app'));
});

gulp.task('default', ['buildHtml','buildJS','buildCSS']);

