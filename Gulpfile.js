"use strict";
var gulp = require('gulp');
var wiredep = require('wiredep').stream;


gulp.task('bower', function(){
    gulp.src('./dashboard/index.html')
        .pipe(wiredep({
            ignorePath: './dashboard',
            directory: './dashboard/dependencies',
            bowerJson: require('./bower.json')
        })).pipe(gulp.dest('./dashboard'));
});