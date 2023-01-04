/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const path = require('path');
const extraNodeModules = {
  'realm-flipper-plugin-device': path.resolve(__dirname + '/../realm-flipper-plugin-device/'),
};
const watchFolders = [
  path.resolve(__dirname + '/../realm-flipper-plugin-device/'),
];
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    extraNodeModules,
  },
  watchFolders,
};
