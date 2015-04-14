
module.exports = function(config) {
  config.set({

    basePath: '.',

    frameworks: [
      'chai',
      'mocha',
      'sinon'
    ],

    files: [
      // bower deps
      'bower_components/jquery/dist/jquery.js',
      'bower_components/detect-mobile-browser-tablet-support/detectmobilebrowser.js',
      'bower_components/iscroll-native/src/iscroll.js',
      'bower_components/lodash/dist/lodash.js',

      // everything else
      'src/*.js'
    ],

    reporters: [
      'mocha'
    ],

    client: {
      captureConsole: true,
      mocha: {
        bail: true
      }
    },

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: [
      'Chrome'
    ],

    singleRun: false
  });
};
