const { withPodfile } = require('expo/config-plugins');

/**
 * Compiles react-native-screens' experimental native components, such as
 * Split. Expo Router's plugin does the same; this app doesn't use Expo Router.
 */
module.exports = function withScreensGamma(config) {
  return withPodfile(config, (podfile) => {
    if (!podfile.modResults.contents.includes('RNS_GAMMA_ENABLED')) {
      podfile.modResults.contents = `ENV['RNS_GAMMA_ENABLED'] ||= '1'\n${podfile.modResults.contents}`;
    }
    return podfile;
  });
};
