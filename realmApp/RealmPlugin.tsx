import React, {useEffect} from 'react';
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

type getObjectsQuery = {
  schema: string;
  realm: string;
  cursorId: number;
  filterCursor: number | string;
  limit: number;
  sortingColumn: string;
};

export default React.memo((props: {realms: Realm[]}) => {
  const DEFAULT_PAGE_SIZE = 100; //research right size for 0.5 second load time or possibly use a different variable.
  let realmsMap = new Map<string, Realm>();

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
          const realm = realmsMap.get(obj.realm);
          const schema = obj.schema;
          if (!realm) {
            return;
          }
          console.log('i got', obj, obj.filterCursor, obj.cursorId);
          let objects = realm.objects(schema); //optimize by just getting objects once
          if (!objects.length) {
            connection.send('getObjects', {
              objects: objects,
              total: null,
              next_cursor: null,
              prev_cursor: null,
            });
            return;
          }
          console.log('initially got objects', objects[0]);
          let limit = obj.limit || DEFAULT_PAGE_SIZE;
          limit < 1 ? (limit = 20) : {};
          const objectsLength = objects.length;
          objects = getObjectsByPagination(obj, objects, limit);
          let lastItem, firstItem;
          if (objects.length) {
            lastItem = objects[objects.length - 1]; //if this is null this is the last page
            firstItem = objects[0]; //TODO: not sure about this
          }
          console.log('sending to client now',objects);
          //base64 the next and prev cursors
          connection.send('getObjects', {
            objects: objects,
            total: objectsLength,
            next_cursor: lastItem,
            prev_cursor: firstItem,
          });
        });

        connection.receive('getOneObject', (obj: { realm: string, schema: string, primaryKey: string}) => {
         
          const realm = realmsMap.get(obj.realm);
        
            currentRealm = realm;
         
          const schema = obj.schema;
          if (!realm) {
            return;
          }
          
          const object = realm.objectForPrimaryKey(schema, obj.primaryKey);
          
          connection.send('getOneObject', {object: object});
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

  // function useForceUpdate() {
  //   const [value, setValue] = useState(0); // integer state
  //   return () => setValue(value => value + 1); // update state to force render
  //   // An function that increment 👆🏻 the previous state like here
  //   // is better than directly setting `value + 1`
  // }

  return <Text>dd</Text>;
});
function getObjectsByPagination(
  obj: getObjectsQuery,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  obj.cursorId = obj.cursorId ?? objects.sorted('_id')[0]._id;
  if (obj.sortingColumn) {
    obj.filterCursor =
      obj.filterCursor ??
      objects.sorted(`${obj.sortingColumn}`)[0][obj.sortingColumn];
    objects = objects
      .sorted([`${obj.sortingColumn}`, '_id'])
      .filtered(
        `${obj.sortingColumn} > $0 || (${
          obj.sortingColumn
        } == $0 && _id >= $1) LIMIT(${limit + 1})`,
        obj.filterCursor,
        obj.cursorId,
      );
  } else {
    console.log('simple filtering')
    objects = objects
      .sorted('_id')
      .filtered(`_id > $0 LIMIT(${limit + 1})`, obj.cursorId);
  }
  console.log('got objects', objects);
  return objects;
}
