var baseConfig = require('./karma.conf.base.js');

module.exports = function(config) {

  var newConfig = baseConfig(config);

  // add some other config on top of base
  newConfig.reporters = [
    'dots',
    'coverage'
  ];
  newConfig.preprocessors = {
    'src/*.js': [
      'browserify',
      'coverage'
    ]
  };
  newConfig.coverageReporter = {
    type: 'html',
    dir: 'test-output/coverage'
  };
  newConfig.browserify.transform = ['browserify-istanbul'];

  config.set(newConfig);
};
