
module.exports = function(config) {
  config.set({

    basePath: '.',

    frameworks: [
      'browserify',
      'chai',
      'mocha',
      'sinon',
      'source-map-support'
    ],

    files: [
      // bower deps
      'bower_components/jquery/dist/jquery.js',
      'bower_components/detect-mobile-browser-tablet-support/detectmobilebrowser.js',
      'bower_components/iscroll-native/src/iscroll.js',
      'bower_components/lodash/dist/lodash.js',

      // everything else
      'src/jquery.reading-list.spec.js'
    ],

    preprocessors: {
      'src/*.spec.js': ['browserify']
    },

    reporters: [
      'mocha'
    ],

    browserify: {
      debug: true,
      paths: [
        'src/'
      ]
    },

    client: {
      captureConsole: true,
      mocha: {
        bail: false
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
