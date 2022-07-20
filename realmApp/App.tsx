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
  },
  primaryKey: '_id',
};

const LaptopSchema = {
  name: 'Laptop',
  properties: {
    _id: 'int',
    isLaptop: 'bool',
    list: 'int[]',
    set: 'int<>'
  },
  primaryKey: '_id',
};

// Open a Realm
const realm = new Realm({
  schema: [TaskSchema, BananaSchema, LaptopSchema],
});

addPlugin({
  getId() {
    return 'realm';
  },
  onConnect(connection) {
    const realmPlugin = new RealmPlugin(
      {schema: [TaskSchema, BananaSchema]},
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
  realm.write(() => {
    banana1 = realm.create('Banana', {
      _id: Math.floor(Math.random() * 100000),
      name: 'Jack',
      color: 'yellow',
      length: 40,
      weight: 500,
    });
    console.log(`created one banana: ${banana1.name} with id ${banana1._id}`);
  });
}

function createLaptop() {
  let laptop;
  realm.write(() => {
    laptop = realm.create('Laptop', {
      _id: Math.floor(Math.random() * 100000),
      isLaptop: true,
      list: new Array(1,2,2,2,2,2,2,2,2,2),
      set: [1,2,3,4]
    });
    console.log('type list: ' + typeof laptop.list)
    console.log('type set: ' + typeof laptop.set)
    console.log(`created one laptop: ${laptop.name} with id ${laptop._id}`);
  });
}

addPlugin({
  getId() {
    return 'realm';
  },
  onConnect(connection) {
    connection.receive('getObjects', obj => {
      const schema = obj.schema;
      const objects = realm.objects(schema);
      connection.send('getObjects', {objects: objects});
    });
    connection.receive('getSchemas', () => {
      const schema = realm.schema;
      connection.send('getSchemas', {schemas: schema});
    });
    connection.receive('executeQuery', obj => {
      const objs = realm.objects(obj.schema)

      if (obj.query === '') {
        connection.send('executeQuery', {result: objs})
        return;
      }
      
      let res;
      try {
        res = {result: objs.filtered(obj.query)}
      } catch (err) {
        res = {result: err.message}
      }
      
      connection.send('executeQuery', res)
    });
    console.log('onConnect');
  },
  onDisconnect() {
    console.log('onDisconnect');
  },
});



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
          <Button title="create Laptop" onPress={createLaptop}>
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
