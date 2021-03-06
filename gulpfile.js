/* global exports */

(() => {

    'use strict';

    //----- GULP -----
    const { series, parallel, src, dest, watch } = require('gulp');

    //----- GULP -----
    const
        autoprefixer  = require('gulp-autoprefixer'),
        inlineBase64  = require('gulp-inline-base64'),
        nunjucks      = require('gulp-nunjucks'),
        connect       = require('gulp-connect'),
        replace       = require('gulp-replace'),
        clean         = require('gulp-clean'),
        sass          = require('gulp-sass'),
        zip           = require('gulp-zip'),
        fs            = require('fs'),

        cleanDist     = () => {
            return src('dist', { read: false, allowEmpty: true })
                .pipe(clean());
        },

        zipDist       = () => {
            return src('dist/**/*')
                .pipe(zip('malmo-templates.zip'))
                .pipe(dest('./'));
        },

        css           = () => {
            return src('./src/scss/**/*.scss')
                .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
                .pipe(inlineBase64(
                    {
                        debug  : false,
                        baseDir: './src/scss/img/',
                        maxSize: 1
                    }
                ))
                .pipe(replace('@charset "UTF-8";\n', ''))
                .pipe(autoprefixer({
                    overrideBrowserslist: [
                        'defaults', // > 0.5%, last 2 versions, Firefox ESR, not dead
                        'IE 11'
                    ],
                    cascade             : false
                }))
                .pipe(dest('./demo/css'))
                .pipe(connect.reload());
        },

        js            = () => {
            return src('./src/js/**/*')
                .pipe(dest('./demo/js'))
                .pipe(connect.reload());
        },

        cssDist       = () => {
            return src('./src/scss/**/*.scss')
                .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
                .pipe(inlineBase64(
                    {
                        debug  : false,
                        baseDir: './src/scss/img/',
                        maxSize: 1
                    }
                ))
                .pipe(replace('@charset "UTF-8";\n', ''))
                .pipe(autoprefixer({
                    overrideBrowserslist: [
                        'defaults', // > 0.5%, last 2 versions, Firefox ESR, not dead
                        'IE 11'
                    ],
                    cascade             : false
                }))
                .pipe(dest('./dist/css'))
                .pipe(connect.reload());
        },

        jsDist        = () => {
            return src('./src/js/**/*')
                .pipe(dest('./dist/js'))
                .pipe(connect.reload());
        },

        demoHTML      = () => {
            return src([ './src/**/*', '!./src/js/**/*', '!./src/scss/**/*' ])
                .pipe(replace(/\.html?(.*?)}/, '.html}'))
                .pipe(replace(/PARM{include:\/(.*?)}/ig, '{% include \"\$1\" %}'))
                .pipe(replace(/PARM{include:(.*?)}/ig, '{% include \"\$1\" %}'))
                .pipe(replace(/PARM{text-languageid}/ig, 'sv'))
                .pipe(replace(/PARM{text-index-choose}/ig, 'Välj inloggning'))
                .pipe(replace(/PARM{text-ccp10-name}/ig, 'BankID på samma enhet'))
                .pipe(replace(/PARM{text-ccp11-name}/ig, 'BankID på annan enhet'))
                .pipe(replace(/PARM{text-ccp14-name}/ig, 'SITHS'))
                .pipe(replace(/PARM{text-ccp17-name}/ig, 'Freja eID+'))
                .pipe(replace(/PARM{text-ccp18-name}/ig, 'Net iD Access'))
                .pipe(replace(/PARM{text-idp0-name}/ig, 'Okänt system'))
                .pipe(replace(/PARM{system-sysmsg-content}/ig, 'Ny standardmall för GUI i vår testmiljö. (Denna informationstext används endast vid allvarliga fel i produktion)'))
                .pipe(replace(/PARM{text-footer-companyname}/ig, 'CGI Sverige AB'))
                .pipe(replace(/PARM{text-footer-about}/ig, 'Om tjänsten'))
                .pipe(replace(/PARM{text-footer-cookieinfo}/ig, 'Information om kakor (cookies)'))
                .pipe(replace(/PARM{text-footer-contact}/ig, 'Kontakt & support'))
                .pipe(nunjucks.compile({
                    my_data: 'is here'
                }))
                .pipe(replace(/http-equiv="refresh"/ig, 'name="refresh"'))
                .pipe(dest('./demo'));
        },

        distHTML      = () => {
            return src([
                // INCLUDE
                './src/**/*',
                // EXCLUDE
                '!./src/eid/*_scripts.html',
                '!./src/grp/*_script.html',
                '!./src/js',
                '!./src/**/*.scss',
                '!./src/scss/**/*',
                '!./src/scss'
            ])
                .pipe(dest('./dist'));
        },

        connectServer = (done) => {
            connect.server({
                root      : 'demo',
                https     : {
                    key : fs.readFileSync('_cert/localhost.key'),
                    cert: fs.readFileSync('_cert/localhost.crt')
                },
                livereload: {
                    enable: true,
                    port  : 8088
                },
                port      : 8080
            });
            done();
        },

        addWatcher    = (done) => {
            watch([ './src/**/*' ], parallel(css, js, demoHTML));
            done();
        };

    sass.compiler = require('node-sass');

    exports.default = series(
        parallel(
            css,
            js,
            demoHTML
        ),
        addWatcher,
        connectServer
    );

    exports[ 'build-dist' ] = series(
        cleanDist,
        parallel(
            cssDist,
            jsDist,
            distHTML
        ),
        zipDist
    );


})();

