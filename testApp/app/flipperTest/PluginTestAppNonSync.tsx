import {useState} from 'react';
import React from 'react';
import {FlexAlignType, View, Text, Switch} from 'react-native';
import LegacyTestView from './LegacyTestView';
import TaskManagerWithPlugin from './TaskManagerWrapper';
import RealmPlugin from 'realm-flipper-plugin-device';
import {PluginTestRealmContext} from './Schemas';

export default function PluginTestAppNonSync() {
  const realm = PluginTestRealmContext.useRealm();
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
      <RealmPlugin realms={[realm]} />
      <>
        <View style={testSwitcherStyle}>
          <Text style={textStyle}>To Do App</Text>
          <Switch onValueChange={toggleSwitch} value={isLegacyTester} />
          <Text style={textStyle}>Legacy Tester</Text>
        </View>
        {isLegacyTester ? <LegacyTestView /> : <TaskManagerWithPlugin />}
      </>
    </>
  );
}
