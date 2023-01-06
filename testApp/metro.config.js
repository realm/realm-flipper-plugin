/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const path = require('path');

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },

  // This resolver configuration allows the device plugin's node_modules resolution
  // to use the node_modules of the testApp, thus making sure the react, react-native
  // and react-native-flipper being used is the same both in the plug-in and testApp.
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    blockList: [
      /realm-flipper-plugin-device\/node_modules\/react\/.*/,
      /realm-flipper-plugin-device\/node_modules\/react-native\/.*/,
      /realm-flipper-plugin-device\/node_modules\/react-native-flipper\/.*/,
    ],
  },

  projectRoot: __dirname,
  watchFolders: [path.resolve(__dirname, '../realm-flipper-plugin-device/')],
};
