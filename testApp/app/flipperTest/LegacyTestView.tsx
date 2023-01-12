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

import {
  FlipperTestRealmContext,
  FlipperTestSecondRealmContext,
} from './Schemas';
import {createParcelTestData} from './testData/createParcelTestData';
import {createCornerCaseData} from './testData/createCornerCaseData';

function createBanana(realm: Realm) {
  let banana = realm.write(() => {
    return realm.create('Banana', {
      _id: Math.floor(Math.random() * 100000000),
      name: 'Jack',
      color: 'yellow',
      length: 40,
      weight: 309,
    });
  });
  //@ts-expect-error TODO: use TS types in schema.
  console.log(`created one banana: ${banana.name} with id ${banana._id}`);
}

function deleteBanana(realm: Realm) {
  realm.write(() => {
    realm.delete(realm.objects('Banana')[0]);
  });
}

function editBanana(realm: Realm) {
  const bananas = realm.objects('Banana');

  realm.write(() => {
    //@ts-expect-error TODO: use TS types in schema.
    bananas[Math.floor(Math.random() * bananas.length)].color = 'blue';
  });
}

const LegacyTestView = () => {
  const realm = FlipperTestRealmContext.useRealm();
  const realm2 = FlipperTestSecondRealmContext.useRealm();
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
          <Button title="Create Banana" onPress={() => createBanana(realm)} />
          <Button title="Edit Banana" onPress={() => editBanana(realm)} />
          <Button title="Delete Banana" onPress={() => deleteBanana(realm)} />
          <Button
            title="Delete + Create AllTypes Testdata"
            onPress={() => createAllTypesTestData(realm)}
          />
          <Button
            title="Delete + create Parcel Testdata"
            onPress={() => createParcelTestData(realm2)}
          />
          <Button
            title="Delete + create CornerCase Testdata"
            onPress={() => createCornerCaseData(realm)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LegacyTestView;
