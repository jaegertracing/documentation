const gulp     = require('gulp'),
      sass     = require('gulp-sass'),
      hash     = require('gulp-hash'),
      prefixer = require('gulp-autoprefixer'),
      uglify   = require('gulp-uglify'),
      concat   = require('gulp-concat'),
      del      = require('del');

const SRCS = {
  sass:      'source/sass/style.sass',
  sassWatch: 'source/sass/**/*.sass',
  js:        'source/js/**/*.js'
}

const DIST = {
  css: 'static/css',
  js:  'static/js'
}

gulp.task('js', (done) => {
  del(['static/js/app-*.js']);

  gulp.src(SRCS.js)
    .pipe(uglify())
    .pipe(concat('app.js'))
    .pipe(hash())
    .pipe(gulp.dest(DIST.js))
    .pipe(hash.manifest('assetHashes.json'))
    .pipe(gulp.dest('data'));

  done();
});

gulp.task('js:watch', () => {
  gulp.watch(SRCS.js, gulp.series('js'));
});

gulp.task('sass', (done) => {
  del(['static/css/style-*.css']);

  gulp.src(SRCS.sass)
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(prefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(hash())
    .pipe(gulp.dest(DIST.css))
    .pipe(hash.manifest('assetHashes.json'))
    .pipe(gulp.dest('data'));

  done();
});

gulp.task('sass:watch', () => {
  gulp.watch(SRCS.sassWatch, gulp.series('sass'));
});

gulp.task('build', gulp.series('sass', 'js'));

gulp.task('dev', gulp.series('build', gulp.parallel('sass:watch', 'js:watch')));
