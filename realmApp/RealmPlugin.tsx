import React, {useEffect} from 'react';
import {Text} from 'react-native';
import {addPlugin, Flipper} from 'react-native-flipper';
import Realm, {
  CanonicalObjectSchema,
  CanonicalObjectSchemaProperty,
} from 'realm';

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
    console.log('convertLeaf', value, type);

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
        console.log('received set:', val);
        // due to a problem with serialization, Set is being passed over as a list
        const realVal = (val as any[]).map(value => {
          return convertLeaf(value, property.objectType);
        });
        return realVal;
      case 'list':
        console.log('prop:', property, ' val:', val);
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
  console.log('object before', schemaName);
 
  Object.entries(object).forEach((value: [string, unknown]) => {
    const type = schemaObj.properties[value[0]];
    console.log('handling val: ', value, 'of type', type);
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
  const DEFAULT_PAGE_SIZE = 100; //research right size for 0.5 second load time or possibly use a different variable.
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
          console.log("received");
          const realm = realmsMap.get(obj.realm);
          if (schemaToObjects.has(obj.schema)) {
            schemaToObjects.get(obj.schema).removeAllListeners();
          }

          let objects = realm?.objects(obj.schema);
          let objectsToListenTo: Realm.Results<Realm.Object> = realm?.objects(
            obj.schema,
          );
          if (obj.sortingColumn) {
            objectsToListenTo = objects.sorted([
              [`${obj.sortingColumn}`, false],
              ['_id', false],
            ]);
          } else {
            objectsToListenTo = objects.sorted('_id');
          }
          objectsToListenTo.addListener(onObjectsChange);
          schemaToObjects.set(obj.schema, objectsToListenTo);
        });

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
          let objects = realm.objects(schema);
          if (!objects.length) {
            connection.send('getObjects', {
              objects: objects,
              total: null,
              next_cursor: null,
              prev_cursor: null,
            });
            return;
          }
          if (schemaToObjects.has(schema)) {
            schemaToObjects.get(schema).removeAllListeners();
          }
          let objectsToListenTo: Realm.Results<Realm.Object> = objects;
          if (obj.sortingColumn) {
            objectsToListenTo = objects.sorted([
              [`${obj.sortingColumn}`, false],
              ['_id', false],
            ]);
          } else {
            objectsToListenTo = objects.sorted('_id');
          }
          objectsToListenTo.addListener(onObjectsChange);
          schemaToObjects.set(schema, objectsToListenTo);

          let limit = obj.limit || DEFAULT_PAGE_SIZE;
          limit < 1 ? (limit = 20) : {};
          const objectsLength = objects.length;
          if (obj.backwards) {
            objects = getPrevObjectsByPagination(obj, objects, limit);
          } else {
            objects = getObjectsByPagination(obj, objects, limit);
          }
          let lastItem, firstItem;
          if (objects.length) {
            lastItem = objects[objects.length - 1];
            firstItem = objects[0];
          }
          //base64 the next and prev cursors

          connection.send('getObjects', {
            objects: objects,
            total: objectsLength,
            next_cursor: lastItem,
            prev_cursor: firstItem,
          });
        });

        connection.receive('getSchemas', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const schemas = realm.schema;
          // for (let schema of realm.schema) {
          //   const objects = realm.objects(schema.name);
          //   if (schemaToObjects.has(schema.name)) {
          //     console.log('removing all listeners from ', schema.name);
          //     schemaToObjects.get(schema.name).removeAllListeners();
          //   }
          //   console.log('adding listener to', schema.name);
          //   objects.addListener(onObjectsChange);
          //   schemaToObjects.set(schema.name, objects);
          // }
          connection.send('getSchemas', {schemas: schemas});
        });

        connection.receive('executeQuery', (obj, responder) => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const objs = realm.objects(obj.schema);
          if (obj.query === '') {
            responder.success(objs);
            // connection.send('executeQuery', {result: objs});
            return;
          }

          let res;
          try {
            res = objs.filtered(obj.query);
            responder.success(res);
          } catch (err) {
            responder.error({message: err.message});
            // res = {result: err.message};
          }
          // responder.error(res);
          // connection.send('executeQuery', res);
        });
        connection.receive('addObject', obj => {
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const converted = typeConverter(obj.object, realm, obj.schema);
          console.log('trying to create:', converted);
          realm.write(() => {
            let t = realm.create(obj.schema, converted);
            console.log('created', t);
          });

          const objects = realm.objects(obj.schema);
          modifyObjects(objects, obj.schema, realm);
          connection.send('getObjects', {objects: objects});
        });
        connection.receive('modifyObject', obj => {
          // console.log('modify', obj)
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          console.log('got', obj.object);
          const converted = typeConverter(obj.object, realm, obj.schema);
          console.log('converted', converted)
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
          changes.deletions.forEach(index => {
            if (connection) {
              connection.send('liveObjectDeleted', {
                index: index,
              });
            }
          });

          changes.insertions.forEach(index => {
            const inserted = objects[index];
            if (connection) {
              connection.send('liveObjectAdded', {
                newObject: inserted,
                index: index,
              });
            }
          });

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
  return <Text>dd</Text>;
});

function getObjectsByPagination(
  obj: getObjectsQuery,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  let filterCursor = null;
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
    objects = getObjectsDescending(obj, cursorId, filterCursor, objects, limit);
  } else {
    objects = getObjectsAscending(obj, cursorId, filterCursor, objects, limit);
  }
  return objects;
}

function getPrevObjectsByPagination(
  obj: getObjectsQuery,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  let filterCursor = null;
  const shouldSortDescending = obj.sortDirection === 'descend';
  if (obj.sortingColumn) {
    filterCursor =
      obj.prev_page_filterCursor ??
      objects.sorted(`${obj.sortingColumn}`, shouldSortDescending)[0][
        obj.sortingColumn
      ];
  }
  const prevPageCursorId =
    obj.prev_page_cursorId ??
    objects.sorted('_id', shouldSortDescending)[0]._id;
  if (shouldSortDescending) {
    objects = getPrevObjectsDescending(
      obj,
      prevPageCursorId,
      filterCursor,
      objects,
      limit,
    );
  } else {
    objects = getPrevObjectsAscending(
      obj,
      prevPageCursorId,
      filterCursor,
      objects,
      limit,
    );
  }
  return objects;
}

function getPrevObjectsDescending(
  obj: getObjectsQuery,
  prevPageCursorId: number,
  prevPageFilterCursor: number | string,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  const {sortingColumn} = obj;
  if (sortingColumn) {
    objects = objects
      .sorted([
        [`${sortingColumn}`, false],
        ['_id', false],
      ])
      .filtered(
        `${sortingColumn} ${
          !obj.prev_page_filterCursor ? '>=' : '>'
        } $0 || (${sortingColumn} == $0 && _id ${
          !obj.prev_page_cursorId ? '>=' : '>'
        } $1) LIMIT(${limit})`,
        prevPageFilterCursor,
        prevPageCursorId,
      );
  } else {
    objects = objects
      .sorted('_id', false)
      .filtered(
        `_id ${!obj.prev_page_cursorId ? '>=' : '>'} $0 LIMIT(${limit})`,
        prevPageCursorId,
      );
  }
  console.log(obj.prev_page_filterCursor);
  if (obj.prev_page_filterCursor) {
    objects = objects.sorted([
      [`${sortingColumn}`, true],
      ['_id', true],
    ]);
  } else if (obj.prev_page_cursorId) {
    objects = objects.sorted('_id', true);
  }
  return objects;
}

function getPrevObjectsAscending(
  obj: getObjectsQuery,
  prevPageCursorId: number,
  prevPageFilterCursor: number | string,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  const {sortingColumn} = obj;
  console.log('ascending previous');
  if (sortingColumn) {
    objects = objects
      .sorted([
        [`${sortingColumn}`, true],
        ['_id', true],
      ])
      .filtered(
        `${sortingColumn} ${
          !obj.prev_page_filterCursor ? '<=' : '<'
        } $0 || (${sortingColumn} == $0 && _id ${
          !obj.prev_page_cursorId ? '<=' : '<'
        } $1) LIMIT(${limit})`,
        prevPageFilterCursor,
        prevPageCursorId,
      );
  } else {
    objects = objects
      .sorted('_id', true)
      .filtered(
        `_id ${!obj.prev_page_cursorId ? '<=' : '<'} $0 LIMIT(${limit})`,
        prevPageCursorId,
      );
  }
  if (obj.prev_page_filterCursor) {
    objects = objects.sorted([
      [`${sortingColumn}`, false],
      ['_id', false],
    ]);
  } else if (obj.prev_page_cursorId) {
    objects = objects.sorted('_id');
  }

  return objects;
}

function getObjectsDescending(
  obj: getObjectsQuery,
  cursorId: number,
  filterCursor: number | string,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  const {sortingColumn} = obj;
  if (sortingColumn) {
    objects = objects
      .sorted([
        [`${sortingColumn}`, true],
        ['_id', true],
      ])
      .filtered(
        `${sortingColumn} ${
          !obj.filterCursor ? '<=' : '<'
        } $0 || (${sortingColumn} == $0 && _id ${
          !obj.cursorId ? '<=' : '<'
        } $1) LIMIT(${limit})`,
        filterCursor,
        cursorId,
      );
  } else {
    objects = objects
      .sorted('_id', true)
      .filtered(
        `_id ${!obj.cursorId ? '<=' : '<'} $0 LIMIT(${limit})`,
        cursorId,
      );
  }
  return objects;
}

function getObjectsAscending(
  obj: getObjectsQuery,
  cursorId: number,
  filterCursor: number | string | null,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  const {sortingColumn} = obj;
  if (sortingColumn) {
    objects = objects
      .sorted([
        [`${sortingColumn}`, false],
        ['_id', false],
      ])
      .filtered(
        `${sortingColumn} ${
          !obj.filterCursor ? '>=' : '>'
        } $0 || (${sortingColumn} == $0 && _id ${
          !obj.cursorId ? '>=' : '>'
        } $1) LIMIT(${limit})`,
        filterCursor,
        cursorId,
      );
  } else {
    objects = objects
      .sorted('_id', false)
      .filtered(
        `_id ${!obj.cursorId ? '>=' : '>'} $0 LIMIT(${limit})`,
        cursorId,
      );
  }
  return objects;
}
