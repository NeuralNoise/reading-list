
module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: [
      'browserify',
      'mocha',
      'source-map-support'
    ],

    files: [
      'src/*.js'
    ],

    preprocessors: {
      'src/*.js': [
        'browserify',
        'coverage'
      ]
    },

    reporters: [
      'coverage',
      'progress'
    ],

    coverageReporter: {
      type: 'html',
      dir: 'test-output/coverage'
    },

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: [
      'Chrome'
    ],

    plugins: [
      'karma-browserify',
      'karma-chrome-launcher',
      'karma-coverage',
      'karma-mocha',
      'karma-source-map-support'
    ],

    browserify: {
      debug: true,
      paths: [
        'bower_components/iscroll-native/src/',
        'bower_components/jquery/dist/',
        'bower_components/lodash/dist/',
        'src/'
      ],
      // use istanbul for the coverage tool so that coverage report has correct lines
      transform: ['browserify-istanbul']
    },

    singleRun: false
  });
};
