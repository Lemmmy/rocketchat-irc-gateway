import gulp from "gulp";
import plumber from "gulp-plumber";
import babel from "gulp-babel";
import watch from "gulp-watch";
import eslint from "gulp-eslint";

gulp.task("lint", () => {
  gulp.src("./src/**/*.js")
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task("build", () => {
  gulp.src("./src/**/*.js")
    .pipe(plumber())
    .pipe(babel())
    .pipe(plumber.stop())
    .pipe(gulp.dest("./dist"));
});

gulp.task("watch", ["lint", "build"], () => {
  watch("./src/**/*.js", () => {
    gulp.start(["lint", "build"]);
  });
});

gulp.task("default", ["watch"]);