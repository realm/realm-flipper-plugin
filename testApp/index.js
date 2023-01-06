/**
 * @format
 */

import 'react-native-get-random-values';
import React from 'react';
import {AppRegistry} from 'react-native';
import {AppWrapperSync} from './app/AppWrapperSync';
import {name as appName} from './app.json';
import {SYNC_CONFIG} from './sync.config';
import {FlipperTestAppWrapperNonSync} from './app/flipperTest/FlipperTestAppWrapperNonSync';

const App = () =>
  SYNC_CONFIG.enabled ? (
    <AppWrapperSync appId={SYNC_CONFIG.appId} />
  ) : (
    <FlipperTestAppWrapperNonSync />
  );

AppRegistry.registerComponent(appName, () => App);
