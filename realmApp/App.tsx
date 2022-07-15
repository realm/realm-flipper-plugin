/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {useEffect, useState} from 'react';
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

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
let realmConnection = null;
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

// Open a Realm
const realm = new Realm({
  schema: [TaskSchema],
});

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

function onObjectsChange(objects, changes) {
  // Handle deleted Dog objects
  changes.deletions.forEach((index) => {
    // You cannot directly access deleted objects,
    // but you can update a UI list, etc. based on the index.
    console.log(`Looks like Dog #${index} has left the realm.`);
    if (realmConnection) {
      realmConnection.send('liveObjectDeleted', {index: index});
    }
  });
  // Handle newly added Dog objects
  changes.insertions.forEach((index) => {
    const inserted = objects[index];
    console.log(`Welcome our new friend, ${inserted._id}!`);
    if (realmConnection) {
      realmConnection.send('liveObjectAdded', {newObject: inserted});
    }
  });
  // Handle Dog objects that were modified
  changes.modifications.forEach((index) => {
    const modified = objects[index];
    console.log(`Hey ${modified.name}, you look different!`);
    if (realmConnection) {
      realmConnection.send('liveObjectEdited', {newObject: modified, index: index});
    }
  });
}

addPlugin({
  getId() {
    return 'realm';
  },
  onConnect(connection) {
    realmConnection = connection;
    connection.receive('getObjects', obj => {
      const schema = obj.schema;
      const objects = realm.objects(schema);
      try {
        objects.addListener(onObjectsChange);
      } catch (error) {
        console.error(
          `An exception was thrown within the change listener: ${error}`
        );
      }
      connection.send('getObjects', {objects: objects});
    });
    connection.receive('getSchemas', () => {
      const schema = realm.schema;
      connection.send('getSchemas', {schemas: schema});
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
