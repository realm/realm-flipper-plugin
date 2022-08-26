import React, {useEffect} from 'react';
import {Text} from 'react-native';
import {addPlugin, Flipper} from 'react-native-flipper';
import Realm, {
  CanonicalObjectSchema,
  CanonicalObjectSchemaProperty,
} from 'realm';
import {convertObjects} from './ConvertFunctions';
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

// convert object from a schema to realm one
const typeConverter = (object: any, realm: Realm, schemaName?: string) => {
  if (!schemaName) {
    throw new Error('Converting with missing schema name');
  }
  const readObject = (objectType: string, value: any) => {
    const innerSchema = realm.schema.find(
      schema => schema.name === objectType,
    ) as CanonicalObjectSchema;
    const convertedKey = convertLeaf(
      value[schemaObj?.primaryKey as string],
      innerSchema.properties[innerSchema.primaryKey as string].type,
    );
    return value === null
      ? null
      : realm.objectForPrimaryKey(objectType, convertedKey);
  };

  const convertLeaf = (value: any, type: string, objectType?: string) => {
    // console.log('convertLeaf', value, type);

    // console.log(value);
    switch (type) {
      case 'object':
        return readObject(objectType as string, value);
      case 'uuid':
        return new BSON.UUID(value);
      case 'decimal128':
        return new BSON.Decimal128(value);
      case 'objectId':
        return new BSON.ObjectId(value);
      case 'data':
        // console.log('data with value:', value.length);
        const arr = new Uint8Array(value);
        return arr;
      default:
        // console.log('returning default', value)
        return value;
    }
  };

  // console.log('converting...', object);
  const convertRoot = (val: any, property: CanonicalObjectSchemaProperty) => {
    if (val === null) {
      return null;
    }
    // console.log('got type', type);
    switch (property.type) {
      case 'set':
        //console.log('received set:', val);
        // due to a problem with serialization, Set is being passed over as a list
        const realVal = (val as any[]).map(value => {
          return convertLeaf(value, property.objectType);
        });
        return realVal;
      case 'list':
        // console.log('prop:', property, ' val:', val);
        return val.map(obj => {
          return convertLeaf(obj, property.objectType as string);
        });
      case 'dictionary':
        return val;
      case 'object':
        return readObject(property.objectType as string, val);
      default:
        return convertLeaf(val, property.type, property.objectType);
    }
  };

  const schemaObj = realm.schema.find(schema => schema.name === schemaName);

  const obj = {};
  Object.entries(object).forEach((value: [string, unknown]) => {
    const type = schemaObj?.properties[value[0]];
    obj[value[0]] = convertRoot(value[1], type);
  });
  // console.log('returning', obj);
  // console.log('example:', new BSON.UUID());
  return obj;
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
          if (!objects.length) {
            responder.error({message: 'No objects found in the schema'});
            return;
          }
          listenerHandler = new Listener(
            schemaToObjects,
            schema,
            objects,
            sortingColumn,
            sortingDirection,
            connection,
          );
          listenerHandler.handleAddListener();
          const totalObjects = objects.length;
          let cursorId = null;
          const LIMIT = 50;
          const shouldSortDescending = sortingDirection === 'descend';
          cursorId = req.cursorId ?? objects[0]._objectKey();
          if (sortingColumn) {
            objects = objects.sorted(sortingColumn, shouldSortDescending);
            cursorId = req.cursorId ?? objects[0]._objectKey();
          }
          let howFarWeGot = realm._objectForObjectKey(schema, cursorId);
          let index = objects.findIndex(
            obj => obj._objectKey() === howFarWeGot._objectKey(),
          );
          objects = objects.slice(
            index === 0 ? index : index + 1,
            index + (LIMIT + 1),
          );
          if (!objects) {
            // responder.error({message: 'No objects found'});
            return;
          }
          const afterConversion = convertObjects(
            objects,
            realm.schema.find(schemaa => schemaa.name === schema),
            realm.schema,
          );
          console.log('sending back!');
          responder.success({
            objects: afterConversion,
            total: totalObjects,
            hasMore: objects.length >= LIMIT,
            nextCursor: objects[objects.length - 1]._objectKey(),
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
        connection.receive('addObject', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const converted = typeConverter(obj.object, realm, obj.schema);
          // console.log('trying to create:', converted);
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
        connection.receive('modifyObject', obj => {
          // console.log('modify', obj)
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const propsChanged = obj.propsChanged;
          const schema = realm.schema.find(
            schemaObj => schemaObj.name === obj.schema,
          ) as CanonicalObjectSchema;

          const converted = typeConverter(obj.object, realm, obj.schema);
          console.log('converted obj is:', converted);
          // load the values to be modified
          const newObject = {};
          propsChanged.forEach(propName => {
            newObject[propName] = converted[propName];
          });

          // load all the rest values from the existing realm object
          const primaryKey = converted[schema.primaryKey];
          console.log('primary key: ' + primaryKey);
          const realmObj = realm.objectForPrimaryKey(schema.name, primaryKey);
          console.log('keys:', Object.keys(realmObj));
          Object.keys(schema.properties).forEach(key => {
            if (!propsChanged.find(val => val === key)) {
              newObject[key] = realmObj[key];
            }
          });

          // console.error('object after modifications:', newObject);
          realm.write(() => {
            realm.create(obj.schema, newObject, 'modified');
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

          const object = typeConverter(obj.object, realm, schema?.name);

          const primaryKey = schema?.primaryKey;
          if (!schema || !primaryKey) {
            return;
          }

          try {
            realm.write(() => {
              const realmObj = realm.objectForPrimaryKey(
                schema.name,
                object[primaryKey],
              );
              realm.delete(realmObj);
            });
          } catch (err) {
            responder.error({error: err.message});
          }

          const objects = realm.objects(obj.schema);
          connection.send('getObjects', {objects: objects});
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
