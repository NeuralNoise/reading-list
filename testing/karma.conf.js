var baseConfig = require('./karma.conf.base.js');

module.exports = function(config) {
  config.set(baseConfig(config));
};
