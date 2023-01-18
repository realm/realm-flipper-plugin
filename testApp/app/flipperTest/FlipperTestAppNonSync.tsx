import {useState} from 'react';
import React from 'react';
import {FlexAlignType, View, Text, Switch} from 'react-native';
import LegacyTestView from './LegacyTestView';
import RealmPlugin from 'realm-flipper-plugin-device';
import {
  FlipperTestRealmContext,
  FlipperTestSecondRealmContext,
} from './Schemas';
import {AppNonSync} from '../AppNonSync';
import {TaskRealmContext} from '../models';

export default function FlipperTestAppNonSync() {
  const realm = FlipperTestRealmContext.useRealm();
  const secondRealm = FlipperTestSecondRealmContext.useRealm();
  const templateAppRealm = TaskRealmContext.useRealm();

  const [isLegacyTester, setIsLegacyTester] = useState(false);
  const toggleSwitch = () => setIsLegacyTester(previousState => !previousState);
  const textStyle = {
    color: '#fff',
    padding: 20,
  };
  const testSwitcherStyle = {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as FlexAlignType,
  };
  return (
    <>
      <RealmPlugin realms={[realm, secondRealm, templateAppRealm]} />
      <>
        <View style={testSwitcherStyle}>
          <Text style={textStyle}>Template To Do App</Text>
          <Switch
            onValueChange={toggleSwitch}
            value={isLegacyTester}
            ios_backgroundColor={'#ccc'}
          />
          <Text style={textStyle}>Legacy Tester</Text>
        </View>
        {isLegacyTester ? <LegacyTestView /> : <AppNonSync />}
      </>
    </>
  );
}
