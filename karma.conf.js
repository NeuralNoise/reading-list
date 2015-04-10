
module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: [
      'browserify',
      'mocha'
    ],

    files: [
      // bower stuff
      'bower_components/jquery/dist/jquery.js',

      // everything else
      'src/*.js'
    ],

    preprocessors: {
      'bower_components/**.js': ['browserify'],
      'src/*.js': ['browserify']
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: [
      'Chrome'
    ],

    plugins: [
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-browserify'
    ],

    browserify: {
      debug: true,
    },

    singleRun: false
  });
};
