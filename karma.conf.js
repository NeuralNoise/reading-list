
module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: [
      'browserify',
      'mocha'
    ],

    files: [
      'src/*.js'
    ],

    preprocessors: {
      'src/!(*.spec).js': [
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
      'karma-mocha'
    ],

    browserify: {
      debug: true,
      paths: [
        'bower_components/iscroll-native/src/',
        'bower_components/jquery/dist/',
        'bower_components/lodash/dist/'
      ],
      transform: ['browserify-istanbul']
    },

    singleRun: false
  });
};
