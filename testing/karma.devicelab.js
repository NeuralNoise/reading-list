var baseConfig = require('./karma.conf.base.js');

module.exports = function(config) {
  var newConfig = baseConfig(config);

  newConfig.browserStack = {
    username: process.env.BROWSER_STACK_USERNAME,
    accessKey: process.env.BROWSER_STACK_ACCESS_KEY,
  };
  newConfig.customLaunchers = {
    //bs_safari_8: {
    //  base: 'BrowserStack',
    //  os: 'osx',
    //  os_version: 'yosemite',
    //  browser: 'safari',
    //  browser_version: '8',
    //},
    bs_chrome_47: {
      base: 'BrowserStack',
      os: 'osx',
      os_version: 'yosemite',
      browser: 'chrome',
      browser_version: '47',
    },
    //bs_firefox_43: {
    //  base: 'BrowserStack',
    //  os: 'osx',
    //  os_version: 'yosemite',
    //  browser: 'firefox',
    //  browser_version: '43',
    //},
    //bs_ie_10: {
    //  base: 'BrowserStack',
    //  os: 'windows',
    //  os_version: '7',
    //  browser: 'ie',
    //  browser_version: '10.0',
    //},
    //bs_ie_11: {
    //  base: 'BrowserStack',
    //  os: 'windows',
    //  os_version: '8.1',
    //  browser: 'ie',
    //  browser_version: '11.0',
    //},
  };
  newConfig.browsers = Object.keys(newConfig.customLaunchers);
  config.set(newConfig);
}
