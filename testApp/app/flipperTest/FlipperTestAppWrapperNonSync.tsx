import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';

import colors from '../styles/colors';
import {
  FlipperTestRealmContext,
  FlipperTestSecondRealmContext,
} from './Schemas';
import FlipperTestAppNonSync from './FlipperTestAppNonSync';
import {TaskRealmContext} from '../models';

export const FlipperTestAppWrapperNonSync = () => {
  // If sync is disabled, setup the app without any sync functionality and return early
  return (
    <SafeAreaView style={styles.screen}>
      <TaskRealmContext.RealmProvider>
        <FlipperTestRealmContext.RealmProvider>
          <FlipperTestSecondRealmContext.RealmProvider>
            <FlipperTestAppNonSync />
          </FlipperTestSecondRealmContext.RealmProvider>
        </FlipperTestRealmContext.RealmProvider>
      </TaskRealmContext.RealmProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.darkBlue,
  },
});
