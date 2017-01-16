var gulp = require('gulp'),
    clean = require('gulp-clean'),
    runSequence = require('run-Sequence'),
    zip = require('gulp-zip'),
    sass = require('gulp-sass');

var connect = require('gulp-connect');
var notify = require('gulp-notify');
var rename = require('gulp-rename');  
var gutil = require('gulp-util');
var imagemin = require('gulp-imagemin');


var fs = require('fs');

var dist = 'dist';

//清楚发布目录
gulp.task('clean', function() {
    return gulp.src(dist).pipe(clean());
});


//打包后重命名文件
gulp.task('rename', function() {
    return gulp.src(dist + '/pages/*.html')
        .pipe(rename({
            extname: '.php'
        }))
        .pipe(gulp.dest(dist));
});

//sass css 
gulp.task('sass', function() {
    return gulp.src('src/sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(dist + '/css/'))
});

//实时监听文件修改
gulp.task('watch', function(cb) {
    gulp.watch(['src/**/*'], function() {
        runSequence(['copy', 'sass'], function() {
            gutil.log('watch triggered')
        });
    });
    cb();
});


//文件夹的拷贝
gulp.task('copy', function() {
    return gulp.src(['src/!(sass)*/**']).pipe(gulp.dest('dist'));
});


//压缩图片大小子任务
gulp.task('clear-images', function() {
    return gulp.src('dis/images/**').pipe(clean());
});

gulp.task('compress-images', function() {
    return gulp.src('src/images/**')
        .pipe(imagemin({
            progressive: true
        }))
        .pipe(gulp.dest('dist/images'));
});



//压缩图片
gulp.task('images', function() {
    runSequence('clear-images', 'compress-images');
});



//编译完成打包成zip文件
gulp.task('zip',function() {
  return gulp
      .src([dist + '/**/*', '!'+dist+'/*.html', '!'+dist+'/*.zip'])
      .pipe(zip('h5.zip'))
      .pipe(gulp.dest('dist/'));
});

//  --------start:webserver

var webserverOptions = {
    livereload: true,
    root: [__dirname + "/dist"]
};

gulp.task('webserver', function() {
    connect.server(webserverOptions);
});

gulp.task('reloadserver', function() {
    gulp.src('dist/pages/*.html')
        .pipe(connect.reload());
});


gulp.task('liveserver', ['webserver'], function() {
    gulp.watch('./dist/**/*', ['reloadserver']);
});

//  -----ened:webserver

//发布打包
gulp.task('build', function() {
    runSequence('clean', 'copy', 'sass', 'rename', 'images','zip');
});

//开发打包
gulp.task('dev', function() {
    runSequence('clean', 'copy', 'sass', 'watch');
});

gulp.task('default', function() {
    console.log('usage:\n\t`>gulp dev`开发[实时监听文件修改，并同步到dist目录]');
    console.log('\t`>gulp build`打包[打包生成到dist目录]');
    console.log('开启 liveserver:\n\t 新建tab页面，切换到工作目录,运行 > `gulp liveserver`,goto http://localhost:8080');

});






