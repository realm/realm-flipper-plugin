/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {useEffect} from 'react';
import Realm from 'realm';
import type {Node} from 'react';
const {UUID} = Realm.BSON;

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

import {addPlugin} from 'react-native-flipper';
import {RealmPlugin} from './RealmPlugin';
import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

// Schema for Realm
const TaskSchema = {
  name: 'Task',
  properties: {
    _id: 'int',
    name: 'string',
    status: 'string?',
  },
  primaryKey: '_id',
};

const BananaSchema = {
  name: 'Banana',
  properties: {
    _id: 'int',
    name: 'string',
    color: 'string',
    length: 'int',
    weight: 'int',
    task: 'Task?',
  },
  primaryKey: '_id',
};

const AllTypes = {
  name: 'AllTypes',
  properties: {
    _id: 'int',
    bool: 'bool',
    int: 'int',
    float: 'float',
    double: 'double',
    string: 'string',
    //decimal128: 'decimal128',
    //objectId: 'objectId',
    data: 'data',
    date: 'date',
    list: 'int[]',
    //linkingObjects: 'linkingObjects',
    dictionary: '{}',
    set: 'int<>',
    mixed: 'mixed',
    uuid: 'uuid',
  },
  primaryKey: '_id',
};

const MaybeSchema = {
  name: 'Maybe',
  properties: {
    _id: 'int',
    name: 'string?',
  },
  primaryKey: '_id',
};

// Open a Realm
const realm = new Realm({
  schema: [TaskSchema, BananaSchema, MaybeSchema, AllTypes],
  schemaVersion: 2,
});

addPlugin({
  getId() {
    return 'realm';
  },
  onConnect(connection) {
    const realmPlugin = new RealmPlugin(
      {schema: [TaskSchema, BananaSchema, MaybeSchema, AllTypes]},
      [realm],
      connection,
    );
    realmPlugin.connectPlugin();
  },
  onDisconnect() {
    console.log('Disconnected');
  },
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

function createBanana() {
  let banana1;
  console.log(realm.objects('Task').slice(0, 1));
  realm.write(() => {
    banana1 = realm.create('Banana', {
      _id: Math.floor(Math.random() * 100000),
      name: 'Jack',
      color: 'yellow',
      length: 40,
      weight: 500,
      task: realm.objects('Task').slice(0, 1),
    });
    console.log(`created one banana: ${banana1.name} with id ${banana1._id}`);
  });
}

function createAllTypes() {
  let allTypes;
  realm.write(() => {
    allTypes = realm.create('AllTypes', {
      _id: Math.floor(Math.random() * 100000),
      bool: true,
      int: 888,
      float: 3.1415,
      double: 3.1415,
      string: 'string',
      //decimal128: new bigDecimal("9823.1297"),
      //objectId: 'objectId',
      data: new ArrayBuffer(6),
      date: new Date('1995-12-17T03:24:00'),
      list: [1, 1, 2, 3, 5, 8, 13],
      //linkingObjects: 'linkingObjects',
      dictionary: {
        windows: 5,
        doors: 3,
        color: 'red',
        address: 'Summerhill St.',
        price: 400123,
      },
      set: [1, 2, 3, 4],
      mixed: new Date('August 17, 2020'),
      uuid: new UUID(),
    });
    console.log(allTypes.data);
    console.log(`created one banana: ${allTypes.name} with id ${allTypes._id}`);
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
          <Button title="create AllTypes" onPress={createAllTypes}>
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
