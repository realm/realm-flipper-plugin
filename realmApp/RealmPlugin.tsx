import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';
import {addPlugin, Flipper} from 'react-native-flipper';
import Realm from 'realm';
// config: Configuration,
//     realms: Realm[],
//     connection: Flipper.FlipperConnection,

type PluginConfig = {
  realms: Realm[];
  connection: Flipper.FlipperConnection;
};

export default React.memo((props: {realms: Realm[]}) => {
  const forceUpdate = useForceUpdate();
  let realmsMap = new Map<string, Realm>();
  const {realms} = props;
  console.log(props);
  console.log(realms);
  useEffect(() => {
    realms.forEach(realm => {
      realmsMap.set(realm.path, realm);
    });
    addPlugin({
      getId() {
        return 'realm';
      },
      onConnect(connection) {
        console.log('connecting', connection);

        connection.receive('getRealms', () => {
          connection.send('getRealms', {
            realms: Array.from(realmsMap.keys()),
          });
        });

        connection.receive('getObjects', obj => {
          const realm = realmsMap.get(obj.realm);
          realm?.addListener('change', () => {
            console.log('big listener fires');
            forceUpdate();
          });
          const schema = obj.schema;
          if (!realm) {
            return;
          }
          const objects = realm.objects(schema);
          try {
            console.log(connection);
            objects.removeAllListeners;
            objects.addListener(onObjectsChange);
          } catch (error) {
            console.error(
              `An exception was thrown within the change listener: ${error}`,
            );
          }
          connection.send('getObjects', {objects: objects});
        });

        connection.receive('getSchemas', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const schema = realm.schema;
          connection.send('getSchemas', {schemas: schema});
        });

        connection.receive('executeQuery', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const objs = realm.objects(obj.schema);
          try {
            objs.addListener(onObjectsChange);
          } catch (error) {
            console.error(
              `An exception was thrown within the change listener: ${error}`,
            );
          }
          if (obj.query === '') {
            connection.send('executeQuery', {result: objs});
            return;
          }

          let res;
          try {
            res = {result: objs.filtered(obj.query)};
          } catch (err) {
            res = {result: err.message};
          }

          connection.send('executeQuery', res);
        });
        const onObjectsChange = (objects, changes) => {
          changes.deletions.forEach(index => {
            console.log(`small listener fires`, connection);
            if (connection) {
              connection.send('liveObjectDeleted', {index: index});
            }
          });
          // Handle newly added Dog objects
          changes.insertions.forEach(index => {
            const inserted = objects[index];
            console.log(`small listener fires`);
            if (connection) {
              connection.send('liveObjectAdded', {newObject: inserted});
            }
          });
          // Handle Dog objects that were modified
          changes.modifications.forEach(index => {
            const modified = objects[index];
            console.log(`small listener fires`, connection);
            if (connection) {
              connection.send('liveObjectEdited', {
                newObject: modified,
                index: index,
              });
            }
          });
        };
      },
      onDisconnect() {
        console.log('Disconnected');
      },
    });
  });

  function useForceUpdate() {
    const [value, setValue] = useState(0); // integer state
    return () => setValue(value => value + 1); // update state to force render
    // An function that increment 👆🏻 the previous state like here
    // is better than directly setting `value + 1`
  }

  return <Text>dd</Text>;
});
