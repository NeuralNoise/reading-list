
module.exports = function (config) {
  return {
    basePath: '..',

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
      'bower_components/lodash/lodash.js',

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
  };
};
