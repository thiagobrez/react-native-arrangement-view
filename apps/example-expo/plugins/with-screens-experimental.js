const { withPodfile } = require('expo/config-plugins');

module.exports = function withScreensExperimental(config) {
  return withPodfile(config, (podfile) => {
    if (!podfile.modResults.contents.includes('RNS_GAMMA_ENABLED')) {
      podfile.modResults.contents = `ENV['RNS_GAMMA_ENABLED'] ||= '1'\n${podfile.modResults.contents}`;
    }
    return podfile;
  });
};
