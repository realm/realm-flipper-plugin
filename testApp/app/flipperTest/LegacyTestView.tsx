//@ts-nocheck
import {createAllTypesTestData} from './testData/createAllTypesTestData';
import React from 'react';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  useColorScheme,
  View,
  Button,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

import {PluginTestRealmContext} from './Schemas';

// Write a ToDo with random ID to database
function createToDo(realm) {
  let task1;
  realm.write(() => {
    task1 = realm.create('Info', {
      _id: Math.floor(Math.random() * 100000),
      name: 'go grocery shopping',
      status: 'Open',
    });
    console.log(`created one task: ${task1.name} with id ${task1._id}`);
  });
}
function createBanana(realm) {
  let banana1;
  realm.write(() => {
    banana1 = realm.create('Banana', {
      _id: Math.floor(Math.random() * 100000000),
      name: 'Jack',
      color: 'yellow',
      length: 40,
      weight: 309,
    });
    console.log(`created one banana: ${banana1.name} with id ${banana1._id}`);
  });
}

function deleteBanana(realm) {
  realm.write(() => {
    realm.delete(realm.objects('Banana')[0]);
  });
}

function editBanana(realm) {
  const bananas = realm.objects('Banana');

  realm.write(() => {
    bananas[Math.floor(Math.random() * bananas.length)].color = 'blue';
  });
}

const LegacyTestView: () => Node = () => {
  const realm = PluginTestRealmContext.useRealm();
  // const realm2 = LegacyTestSecondRealmContext.useRealm();
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    paddingTop: 100,
    height: '100%',
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Button title="Create Info" onPress={() => createToDo(realm)}>
            {' '}
          </Button>
          <Button title="Create Banana" onPress={() => createBanana(realm)}>
            {' '}
          </Button>
          <Button title="Edit Banana" onPress={() => editBanana(realm)}>
            {' '}
          </Button>
          <Button title="Delete Banana" onPress={() => deleteBanana(realm)}>
            {' '}
          </Button>
          <Button
            title="Delete + Create AllTypes Testdata"
            onPress={() => createAllTypesTestData(realm)}>
            {' '}
          </Button>
          {/* <Button
            title="Delete + create Parcel Testdata"
            onPress={() => createParcelTestData(realm2)}>
            {' '}
          </Button> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LegacyTestView;
