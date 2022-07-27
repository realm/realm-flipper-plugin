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
  let currentCollection: Realm.Results<Realm.Object>;
  let currentRealm: Realm | undefined;
  const {realms} = props;
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
          if (currentRealm) {
            currentRealm.removeAllListeners();
          }
          const realm = realmsMap.get(obj.realm);
          try {
            currentRealm = realm;
          } catch (error) {
            console.error(
              `An exception was thrown within the change listener: ${error}`,
            );
          }
          const schema = obj.schema;
          if (!realm) {
            return;
          }
          let objects = realm.objects(schema);
          console.log("amount of objects is ",objects.length);
          objects = objects
            .sorted('_id')
            .filtered('_id > $0 LIMIT(11)', obj.cursor); //cursor based pagination
          console.log("obj",obj);
          console.log(objects);
          connection.send('getObjects', {objects: objects});
        });

        connection.receive('getSchemas', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const schemas = realm.schema;
          for (let schema of realm.schema) {
            realm.objects(schema.name).addListener(onObjectsChange);
          }
          connection.send('getSchemas', {schemas: schemas});
        });

        connection.receive('executeQuery', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const objs = realm.objects(obj.schema);
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
        connection.receive('addObject', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          realm.write(() => {
            let t = realm.create(obj.schema, obj.object);
            console.log('created', t);
          });

          const objects = realm.objects(obj.schema);
          connection.send('getObjects', {objects: objects});
        });
        connection.receive('modifyObject', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          realm.write(() => {
            realm.create(obj.schema, obj.object, 'modified');
          });

          const objects = realm.objects(obj.schema);
          connection.send('getObjects', {objects: objects});
        });
        connection.receive('removeObject', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }

          const schema = realm.schema.find(
            schema => schema.name === obj.schema,
          );
          const primaryKey = schema?.primaryKey;
          if (!schema || !primaryKey) {
            return;
          }

          try {
            realm.write(() => {
              const realmObj = realm.objectForPrimaryKey(
                schema.name,
                obj.object[primaryKey],
              );
              realm.delete(realmObj);
            });
          } catch (err) {
            responder.error(err.message);
          }

          const objects = realm.objects(obj.schema);
          connection.send('getObjects', {objects: objects});
        });

        const onObjectsChange = (objects, changes) => {
          console.log('small listener fires');
          changes.deletions.forEach(index => {
            if (connection) {
              connection.send('liveObjectDeleted', {index: index});
            }
          });
          // Handle newly added Dog objects
          changes.insertions.forEach(index => {
            const inserted = objects[index];
            if (connection) {
              connection.send('liveObjectAdded', {newObject: inserted});
            }
          });
          // Handle Dog objects that were modified
          changes.modifications.forEach(index => {
            const modified = objects[index];
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
