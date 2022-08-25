/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import Realm from 'realm';

import type {Node} from 'react';

import {createAllTypesTestData} from './TestData/createAllTypesTestData';

// const {UUID} = Realm.BSON;

import {
  BananaSchema,
  AllTypesSchema,
  TaskSchema,
  MaybeSchema,
  NoPrimaryKey,
  DictSchema,
  SetsSchema,
  Parcel,
  ParcelService,
  Delivery,
  MailCarrier,
  DataSchema,
} from './TestData/Schemas';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
} from 'react-native';

import RealmPlugin from './RealmPlugin';
import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import {createParcelTestData} from './TestData/parcelExample';

// Open a Realm
const realm = new Realm({
  schema: [
    TaskSchema,
    BananaSchema,
    MaybeSchema,
    AllTypesSchema,
    NoPrimaryKey,
    DictSchema,
    SetsSchema,
    Parcel,
    ParcelService,
    Delivery,
    MailCarrier,
    DataSchema,
  ],
  path: 'main',
  schemaVersion: 37,
});

//realmPlugin.newfunc();
// Write a ToDo with random ID to database
function createToDo() {
  let task1;
  realm.write(() => {
    task1 = realm.create('Task', {
      _id: Math.floor(Math.random() * 100000),
      name: 'go grocery shopping',
      status: 'Open',
    });
    console.log(`created one task: ${task1.name} with id ${task1._id}`);
  });
}
let i = 1;

function createBanana() {
  let banana1;
  realm.write(() => {
    banana1 = realm.create('Banana', {
      _id: Math.random() * 1000000000,
      name: 'Jack',
      color: 'yellow',
      length: 40,
      weight: 309,
    });
    console.log(`created one banana: ${banana1.name} with id ${banana1._id}`);
    i++;
  });
}

// for (let i = 0; i<1000000; i++) {
//   createBanana();
// }

function deleteBanana() {
  realm.write(() => {
    realm.delete(realm.objectForPrimaryKey('Banana', 0));
  });
}

function editBanana() {
  realm.write(() => {
    realm.objectForPrimaryKey('Banana', 343754).color = 'Blue';
  });
}

const Section = ({children, title}): Node => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
};

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <RealmPlugin realms={[realm]} />
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Step One">
            Edit <Text style={styles.highlight}>App.js</Text> to change this
            screen and then come back to see your edits.
          </Section>
          <Button title="create ToDo" onPress={createToDo}>
            {' '}
          </Button>
          <Button title="create Banana" onPress={createBanana}>
            {' '}
          </Button>
          <Button title="edit Banana" onPress={editBanana}>
            {' '}
          </Button>
          <Button title="delete Banana" onPress={deleteBanana}>
            {' '}
          </Button>
          <Button
            title="Delete + create AllTypes Testdata"
            onPress={() => createAllTypesTestData(realm)}>
            {' '}
          </Button>
          <Button
            title="Delete + create Parcel Testdata"
            onPress={() => createParcelTestData(realm)}>
            {' '}
          </Button>
          <Section title="See Your Changes">
            <ReloadInstructions />
          </Section>
          <Section title="Debug">
            <DebugInstructions />
          </Section>
          <Section title="Learn More">
            Read the docs to discover what to do next:
          </Section>
          <LearnMoreLinks />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
