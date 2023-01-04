import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';

import colors from './styles/colors';
import {PluginTestRealmContext} from './flipperTest/Schemas';
import PluginTestAppNonSync from './flipperTest/PluginTestAppNonSync';

export const AppWrapperNonSync = () => {
  const {RealmProvider} = PluginTestRealmContext;

  // If sync is disabled, setup the app without any sync functionality and return early
  return (
    <SafeAreaView style={styles.screen}>
      <RealmProvider>
        <PluginTestAppNonSync />
      </RealmProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.darkBlue,
  },
});
