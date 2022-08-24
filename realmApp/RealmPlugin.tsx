import React, {useEffect} from 'react';
import {Text} from 'react-native';
import {addPlugin, Flipper} from 'react-native-flipper';
import Realm, {
  CanonicalObjectSchema,
  CanonicalObjectSchemaProperty,
} from 'realm';
import {convertObjects} from './ConvertFunctions';

const {BSON} = Realm;
const {EJSON} = BSON;
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
  prev_page_cursorId: number;
  prev_page_filterCursor: number;
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
        // console.log('data')
        return new ArrayBuffer(6);
      // const buffer = new ArrayBuffer()
      // const typedArray = Uint8Array.from(value);
      // return new BSON.Binary(typedArray);
      // return typedArray.buffer;
      // return typedArray.buffer;
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
  const DEFAULT_PAGE_SIZE = 50;
  let realmsMap = new Map<string, Realm>();

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
        connection.send('getCurrentQuery');

        connection.receive('receivedCurrentQuery', obj => {
          console.log('received');
          const realm = realmsMap.get(obj.realm);
          if (!realm || !obj.schema) {
            return;
          }
          schemaToObjects = handleAddListener(
            schemaToObjects,
            obj.schema,
            realm.objects(obj.schema),
            obj.sortingColumn,
            obj.sortDirection,
            onObjectsChange,
          );
        });

        connection.receive('getRealms', (_, responder) => {
          responder.success({
            realms: Array.from(realmsMap.keys()),
          });
        });

        connection.receive('getObjects', (req, responder) => {
          console.log('message: ', req);
          const realm = realmsMap.get(req.realm);
          const schema = req.schema;
          if (!realm) {
            responder.error({message: 'No realm found'});
            return;
          }
          let objects = realm.objects(schema);
          console.log('before parsing:', objects[0]);
          const prop = objects[0]._id;
          console.log(prop instanceof BSON.UUID);
          let objj = JSON.stringify(objects[0], (key: string, value: any) => {
            if (value instanceof BSON.UUID) {
              // console.l
              return value.toString();
            }
            return value;
          });
          console.log('obj:', objj);
          let parsedObjects = EJSON.stringify(objj, {
            relaxed: false,
          });
          console.log('parsed objects:', parsedObjects);
          if (!objects.length) {
            responder.error({message: 'No objects found in the schema'});
            return;
          }
          schemaToObjects = handleAddListener(
            schemaToObjects,
            schema,
            objects,
            req.sortingColumn,
            req.sortDirection,
            onObjectsChange,
          );
          let limit = req.limit ?? DEFAULT_PAGE_SIZE;
          const objectsLength = objects.length;
          console.log('received', req);
          objects = getObjectsByPagination(
            req,
            objects,
            limit,
            req.query,
            responder,
          );
          if (!objects) {
            return;
            responder.error({message: 'No objects found'});
          }
          convertObjects(
            objects,
            realm.schema.find(schemaa => schemaa.name === schema),
            realm.schema,
          );
          responder.success({
            objects: objects,
            total: objectsLength,
            hasMore: objects.length >= limit,
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
          // console.log('got', obj.object);
          const converted = typeConverter(obj.object, realm, obj.schema);
          // console.log('converted', converted);

          realm.write(() => {
            realm.create(obj.schema, converted, 'modified');
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

        const onObjectsChange = (objects, changes) => {
          changes.deletions.forEach(index => {
            if (connection) {
              connection.send('liveObjectDeleted', {
                index: index,
              });
              connection.send('getCurrentQuery');
            }
          });

          changes.insertions.forEach(index => {
            const inserted = objects[index];
            if (connection) {
              connection.send('liveObjectAdded', {
                newObject: inserted,
                index: index,
              });
              connection.send('getCurrentQuery');
            }
          });

          changes.modifications.forEach(index => {
            const modified = objects[index];
            if (connection) {
              connection.send('liveObjectEdited', {
                newObject: modified,
                index: index,
              });
              connection.send('getCurrentQuery');
            }
          });
        };
      },
      onDisconnect() {
        for (let objects of schemaToObjects.values()) {
          objects.removeAllListeners();
        }
        console.log('Disconnected');
      },
    });
    return () => {
      for (let objects of schemaToObjects.values()) {
        objects.removeAllListeners();
      }
    };
  });
  return <></>;
});

function handleAddListener(
  schemaToObjects: Map<string, Realm.Results<Realm.Object>>,
  schema: string,
  objects: Realm.Results<Realm.Object>,
  sortingColumn: string,
  sortDirection: 'ascend' | 'descend' | null,
  onObjectsChange: (objects: any, changes: any) => void,
) {
  if (schemaToObjects.has(schema)) {
    schemaToObjects.get(schema).removeAllListeners();
  }
  let objectsToListenTo: Realm.Results<Realm.Object> = objects;
  const shouldSortDescending = sortDirection === 'descend';
  if (sortingColumn) {
    objectsToListenTo = objects.sorted([
      [`${sortingColumn}`, shouldSortDescending],
      ['_id', shouldSortDescending],
    ]);
  } else {
    objectsToListenTo = objects.sorted('_id', shouldSortDescending);
  }
  objectsToListenTo.addListener(onObjectsChange);
  schemaToObjects.set(schema, objectsToListenTo);

  return schemaToObjects;
}

function getObjectsByPagination(
  obj: getObjectsQuery,
  objects: Realm.Results<Realm.Object>,
  limit: number,
  query: string,
  responder: Flipper.FlipperResponder,
) {
  let filterCursor: string | number | null = null;
  const shouldSortDescending = obj.sortDirection === 'descend';
  const cursorId =
    obj.cursorId ?? objects.sorted('_id', shouldSortDescending)[0]._id;
  if (obj.sortingColumn) {
    filterCursor =
      obj.filterCursor ??
      objects.sorted(`${obj.sortingColumn}`, shouldSortDescending)[0][
        obj.sortingColumn
      ];
  }
  if (shouldSortDescending) {
    objects = getObjectsDescending(
      obj,
      cursorId,
      filterCursor,
      objects,
      limit,
      responder,
    );
  } else {
    objects = getObjectsAscending(
      obj,
      cursorId,
      filterCursor,
      objects,
      limit,
      query,
      responder,
    );
  }
  return objects;
}

function getObjectsDescending(
  obj: getObjectsQuery,
  cursorId: number,
  filterCursor: string | number | null,
  objects: Realm.Results<Realm.Object>,
  limit: number,
  responder: Flipper.FlipperResponder,
) {
  const {sortingColumn, sortingColumnType} = obj;
  try {
    objects = objects
      .sorted([
        [`${sortingColumn}`, true],
        ['_id', true],
      ])
      .filtered(
        `${sortingColumn} ${!obj.filterCursor ? '<=' : '<'} ${
          sortingColumnType === 'uuid' ? `uuid(${filterCursor})` : `${cursorId}`
        } || (${sortingColumn} == ${
          sortingColumnType === 'uuid' ? `uuid(${filterCursor})` : `${cursorId}`
        } && _id ${!obj.cursorId ? '<=' : '<'} ${
          sortingColumnType === 'uuid' ? `uuid(${cursorId})` : `${cursorId}`
        }) LIMIT(${limit})`,
        filterCursor,
        cursorId,
      );
    return objects;
  } catch (error) {
    responder.error({message: error});
    return;
  }
}

function getObjectsAscending(
  obj: getObjectsQuery,
  cursorId: number,
  filterCursor: number | string | null,
  objects: Realm.Results<Realm.Object>,
  limit: number,
  query: string,
  responder: Flipper.FlipperResponder,
) {
  const {sortingColumn} = obj;
  if (query) {
    try {
      objects = objects.filtered(query);
    } catch (e) {
      console.log('error, returning:', e.message);
      responder.error({
        message: e.message,
      });
      return;
    }
  }
  if (sortingColumn) {
    console.log('cursorId is', cursorId);
    objects = objects
      .sorted([
        [`${sortingColumn}`, false],
        ['_id', false],
      ])
      .filtered(
        `${sortingColumn} ${!obj.filterCursor ? '>=' : '>'} ${
          obj.sortingColumnType === 'uuid'
            ? `uuid(${filterCursor})`
            : `${filterCursor}`
        } || (${sortingColumn} == ${filterCursor} && _id ${
          !obj.cursorId ? '>=' : '>'
        } ${
          obj.sortingColumnType === 'uuid' ? `uuid(${cursorId})` : `${cursorId}`
        }) LIMIT(${limit})`,
      );
  } else {
    console.log('cursorId is aah', cursorId);
    objects = objects
      .sorted('_id', false)
      .filtered(
        `_id ${!obj.cursorId ? '>=' : '>'} ${
          obj.sortingColumnType === 'uuid' ? `uuid(${cursorId})` : `${cursorId}`
        } LIMIT(${limit})`,
        cursorId,
      );
  }
  return objects;
}
