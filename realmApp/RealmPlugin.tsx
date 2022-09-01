import React, {useEffect} from 'react';
import {addPlugin, Flipper} from 'react-native-flipper';
import Realm, {CanonicalObjectSchema} from 'realm';
import {
  convertObjectsFromDesktop,
  convertObjectsToDesktop,
} from './ConvertFunctions';
import {Listener} from './Listener';
import {Query} from './Query';
const {BSON} = Realm;
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
  sortingDirection: 'ascend' | 'descend';
  sortingColumn: string;
  sortingColumnType: string;
};

const modifyObject = (object: any, schemaName: string, realm: Realm) => {
  const schemaObj = realm.schema.find(
    schema => schema.name === schemaName,
  ) as CanonicalObjectSchema;

  //console.log('object before', schemaName);
  Object.entries(object).forEach((value: [string, unknown]) => {
    const type = schemaObj.properties[value[0]];
    // console.log('handling val: ', value, 'of type', type);
    switch (type.name) {
      case 'data':
        const array = value[1] as ArrayBuffer;
        console.log('array found is', array);
        const view = new Uint8Array(array);
        let result: number[] = [];
        for (let i = 0; i < view.length; i++) {
          result = [...result, view[i]];
        }
        object[value[0]] = result;
        break;
      case 'list':
      case 'dictionary':
      case 'set':
      case 'object':
        // TODO: handle recursive stuff
        break;
      default:
        break;
    }
  });
  // console.log('object after', object);
};

const modifyObjects = (objects: any[], schemaName: string, realm: Realm) => {
  console.log('modifying', objects.length, 'objects');
  objects.forEach(obj => {
    modifyObject(obj, schemaName, realm);
  });
};

export default React.memo((props: {realms: Realm[]}) => {
  let realmsMap = new Map<string, Realm>();
  let listenerHandler: Listener;
  const {realms} = props;
  useEffect(() => {
    let schemaToObjects = new Map<string, Realm.Results<Realm.Object>>();
    realms.forEach(realm => {
      realmsMap.set(realm.path, realm);
    });
    addPlugin({
      getId() {
        return 'realm';
      },
      onConnect(connection) {
        // connection.receive
        connection.send('getCurrentQuery');

        connection.receive('receivedCurrentQuery', obj => {
          console.log('received');
          const realm = realmsMap.get(obj.realm);
          if (!realm || !obj.schema) {
            return;
          }
          console.log(obj);
          listenerHandler = new Listener(
            schemaToObjects,
            obj.schema,
            realm.objects(obj.schema),
            obj.sortingColumn,
            obj.sortingDirection,
            connection,
            realm.schema,
          );
          listenerHandler.handleAddListener();
        });

        connection.receive('getRealms', (_, responder) => {
          responder.success({
            realms: Array.from(realmsMap.keys()),
          });
        });

        connection.receive('getObjects', (req, responder) => {
          console.log('message: ', req);
          const realm = realmsMap.get(req.realm);
          if (!realm) {
            responder.error({message: 'No realm found'});
            return;
          }
          const {schema, sortingColumn, sortingDirection} = req;
          let objects = realm.objects(schema);
          listenerHandler = new Listener(
            schemaToObjects,
            schema,
            objects,
            sortingColumn,
            sortingDirection,
            connection,
            realm.schema,
          );
          listenerHandler.handleAddListener();
          const totalObjects = objects.length;
          if (!totalObjects) {
            console.log("here")
            responder.success({
              objects: [],
              total: totalObjects,
              hasMore: false,
              nextCursor: null,
            });
            return;
          }
          let cursorId = null;
          const LIMIT = 50;
          const shouldSortDescending = sortingDirection === 'descend';
          cursorId = req.cursorId ?? objects[0]._objectKey();
          if (sortingColumn) {
            objects = objects.sorted(sortingColumn, shouldSortDescending);
            cursorId = req.cursorId ?? objects[0]._objectKey();
          }
          let howFarWeGot = realm._objectForObjectKey(schema, String(cursorId));
          let index = objects.findIndex(
            obj => obj._objectKey() === howFarWeGot._objectKey(),
          );
          objects = objects.slice(
            index === 0 ? index : index + 1,
            index + (LIMIT + 1),
          );
          console.log('gere');
          const afterConversion = convertObjectsToDesktop(
            objects,
            realm.schema.find(schemaa => schemaa.name === schema),
          );
          console.log('sending back!');
          responder.success({
            objects: afterConversion,
            total: totalObjects,
            hasMore: objects.length >= LIMIT,
            nextCursor: objects[objects.length - 1]?._objectKey(),
          });
        });

        connection.receive('getSchemas', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            responder.error({message: 'No realm found,'});
            return;
          }
          const schemas = realm.schema;
          responder.success({schemas: schemas});
        });

        connection.receive(
          'getOneObject',
          (
            obj: {realm: string; schema: string; primaryKey: string},
            responder,
          ) => {
            const realm = realmsMap.get(obj.realm);
            if (!realm) {
              responder.error({message: 'No realm found.'});
            }
            const schemaObj = realm.schema.find(s => s.name === obj.schema);
            let pk;
            console.log(
              'schemaObj.properties[schemaObj.primaryKey].type',
              schemaObj.properties[schemaObj.primaryKey].type,
            );
            switch (schemaObj.properties[schemaObj.primaryKey].type) {
              // case 'object':
              //   return readObject(objectType as string, value);
              case 'uuid':
                pk = new BSON.UUID(obj.primaryKey);
                break;
              case 'decimal128':
                pk = new BSON.Decimal128(obj.primaryKey);
                break;

              case 'objectID':
                pk = new BSON.ObjectId(obj.primaryKey);
                break;

              // case 'data':
              //   const typedArray = Uint8Array.from(obj.primaryKey);
              //   pk = typedArray.buffer;
              //   break;

              default:
                // console.log('returning default', value)
                pk = obj.primaryKey;
            }
            console.log('obj.primaryKey', pk);
            try {
              const object = realm.objectForPrimaryKey(
                obj.schema,
                // new BSON.UUID(obj.primaryKey),
                pk,
              );
              responder.success(object);
            } catch (err) {
              responder.error({message: err.message});
            }
          },
        );

        // connection.receive('executeQuery', (obj, responder) => {
        //   const realm = realmsMap.get(obj.realm);
        //   if (!realm) {
        //     responder.error({message: 'No realm found.'});
        //     return;
        //   }
        //   const objs = realm.objects(obj.schema);
        //   if (obj.query === '') {
        //     responder.success(objs);
        //     // connection.send('executeQuery', {result: objs});
        //     return;
        //   }

        //   let res;
        //   try {
        //     res = objs.filtered(obj.query);
        //     responder.success(res);
        //   } catch (err) {
        //     responder.error({message: err.message});
        //     // res = {result: err.message};
        //   }
        //   // responder.error(res);
        //   // connection.send('executeQuery', res);
        // });
        connection.receive('downloadData', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            responder.error({message: 'Realm not found'});
            return;
          }
          const object = realm._objectForObjectKey(obj.schema, obj.objectKey);
          responder.success({
            data: Array.from(new Uint8Array(object[obj.propertyName])),
          });
        });

        connection.receive('addObject', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          // console.log('addObject', obj);
          const converted = convertObjectsFromDesktop(
            [obj.object],
            realm,
            obj.schema,
          )[0];
          try {
            realm.write(() => {
              realm.create(obj.schema, converted);
            });
          } catch (err) {
            responder.error({
              error: err.message,
            });
            return;
          }
          responder.success(undefined);
        });
        connection.receive('modifyObject', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const propsChanged = obj.propsChanged;
          const schema = realm.schema.find(
            schemaObj => schemaObj.name === obj.schema,
          ) as CanonicalObjectSchema;

          const converted = convertObjectsFromDesktop(
            [obj.object],
            realm,
            obj.schema,
          )[0];

          const realmObj = realm._objectForObjectKey(
            schema.name,
            obj.objectKey,
          );
          if (!realmObj) {
            responder.error({message: 'Realm Object removed while editing.'});
            return;
          }

          realm.write(() => {
            propsChanged.forEach(propName => {
              realmObj[propName] = converted[propName];
            });
          });
        });

        connection.receive('removeObject', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const foundObject = realm._objectForObjectKey(
            obj.schema,
            obj.objectKey,
          );
          realm.write(() => {
            realm.delete(foundObject);
          });
        });
      },
      onDisconnect() {
        if (listenerHandler) {
          listenerHandler.removeAllListeners();
          console.log('Disconnected');
        }
      },
    });
    return () => {
      if (listenerHandler) {
        listenerHandler.removeAllListeners();
        console.log('Disconnected');
      }
    };
  });
  return <></>;
});
