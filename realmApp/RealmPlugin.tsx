import React, {useEffect} from 'react';
import {Text} from 'react-native';
import {addPlugin, Flipper} from 'react-native-flipper';
import Realm, {
  CanonicalObjectSchema,
  CanonicalObjectSchemaProperty,
  CanonicalPropertiesTypes,
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
  console.log('converting...', object);
  const schemaObj = realm.schema.find(schema => schema.name === schemaName);

  const convertProperty = (
    val: any,
    property: CanonicalObjectSchemaProperty,
  ) => {
    if (val === null) {
      return null;
    }
    // console.log('got type', type);
    switch (property.type) {
      case 'object':
        return val === null
          ? null
          : realm.objectForPrimaryKey(
              property.objectType as string,
              val[schemaObj?.primaryKey as string],
            );
      case 'uuid':
        return new BSON.UUID(val);
      case 'decimal128':
        return new BSON.Decimal128(val);
      case 'objectID':
        return new BSON.ObjectId(val);
      case 'data':
        const typedArray = Uint8Array.from(val);
        return typedArray.buffer;
        // return new ArrayBuffer(val);
      case 'set':
        // due to a problem with serialization, Set is being passed over as a list
        const realVal = (val as any[]).map(value => {
          typeConverter(value, realm, property.objectType);
        });
        return new Set(realVal);
      case 'list':
        console.log('prop:', property, ' val:', val);
        return val.map(obj => {
          typeConverter(obj, realm, property.objectType);
        });
      case 'dictionary':
      default:
        return val;
    }
  };

  const obj = {};
  Object.entries(object).forEach((value: [string, unknown]) => {
    const type = schemaObj?.properties[value[0]];
    console.log('type is', type, 'for key', value[0]);
    obj[value[0]] = convertProperty(value[1], type);
    console.log('value for', value[0], ' is ', obj[value[0]]);
  });
  return obj;
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
          console.log('sending to client now');
          //base64 the next and prev cursors
          connection.send('getObjects', {
            objects: objects,
            total: objectsLength,
            next_cursor: lastItem,
            prev_cursor: firstItem,
          });
        });

        connection.receive('getObjectsBackwards', obj => {
          const realm = realmsMap.get(obj.realm);
          const schema = obj.schema;
          if (!realm) {
            return;
          }
          console.log('BACKWARDS: i got', obj);
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
          objects = getObjectsByPaginationBackwards(obj, objects, limit);
          let lastItem, firstItem;
          if (objects.length) {
            lastItem = objects[objects.length - 1]; //if this is null this is the last page
            firstItem = objects[0]; //TODO: not sure about this
          }
          console.log('sending to client now');
          //base64 the next and prev cursors
          connection.send('getObjects', {
            objects: objects,
            total: objectsLength,
            next_cursor: lastItem,
            prev_cursor: firstItem,
          });
        });

        connection.receive(
          'getOneObject',
          (obj: {realm: string; schema: string; primaryKey: string}) => {
            const realm = realmsMap.get(obj.realm);

            currentRealm = realm;

            const schema = obj.schema;
            if (!realm) {
              return;
            }

            const object = realm.objectForPrimaryKey(schema, obj.primaryKey);

            connection.send('getOneObject', {object: object});
          },
        );

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

          realm.write(() => {
            let t = realm.create(obj.schema, converted);
            console.log('created', t);
          });

          const objects = realm.objects(obj.schema);
          connection.send('getObjects', {objects: objects});
        });
        connection.receive('modifyObject', obj => {
          // console.log('modify', obj)
          const realm = realmsMap.get(obj.realm);
          if (!realm) {
            return;
          }
          const converted = typeConverter(obj.object, realm, obj.schema);
          console.log('converted', converted);
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
  const shouldSortDescending = obj.sortDirection === 'descend';
  obj.cursorId =
    obj.cursorId ?? objects.sorted('_id', shouldSortDescending)[0]._id;
  if (shouldSortDescending) {
    objects = getObjectsDescending(obj, objects, limit);
  } else {
    objects = getObjectsAscending(obj, objects, limit);
  }
  return objects;
}

function getObjectsByPaginationBackwards(
  obj: getObjectsQuery,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  const shouldSortDescending = obj.sortDirection === 'descend';
  obj.prev_page_cursorId =
    obj.prev_page_cursorId ??
    objects.sorted('_id', shouldSortDescending)[0]._id;
  if (shouldSortDescending) {
    objects = getPrevObjectsDescending(obj, objects, limit);
  } else {
    objects = getPrevObjectsAscending(obj, objects, limit);
  }
  if (obj.prev_page_filterCursor) {
    objects = objects.sorted([
      [`${obj.sortingColumn}`, false],
      ['_id', false],
    ]);
  } else if (obj.prev_page_cursorId) {
    objects = objects.sorted('_id');
  }
  return objects;
}

function getPrevObjectsDescending(
  obj: getObjectsQuery,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  if (obj.sortingColumn) {
    obj.prev_page_filterCursor =
      obj.prev_page_filterCursor ??
      objects.sorted(`${obj.sortingColumn}`, true)[0][obj.sortingColumn];
    objects = objects
      .sorted([
        [`${obj.sortingColumn}`, true],
        ['_id', true],
      ])
      .filtered(
        `${obj.sortingColumn} < $0 || (${obj.sortingColumn} == $0 && _id ${
          obj.cursorId ? '<=' : '<'
        } $1) LIMIT(${limit + 1})`,
        obj.prev_page_filterCursor,
        obj.prev_page_cursorId,
      );
  } else {
    objects = objects
      .sorted('_id', true)
      .filtered(
        `_id ${obj.prev_page_cursorId ? '<=' : '<'} $0 LIMIT(${limit + 1})`,
        obj.prev_page_cursorId,
      );
    if (obj.prev_page_cursorId) {
      objects = objects.sorted('_id');
    }
  }
  return objects;
}

function getPrevObjectsAscending(
  obj: getObjectsQuery,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  if (obj.sortingColumn) {
    obj.prev_page_filterCursor =
      obj.prev_page_filterCursor ??
      objects.sorted(`${obj.sortingColumn}`, true)[0][obj.sortingColumn];
    objects = objects
      .sorted([
        [`${obj.sortingColumn}`, true],
        ['_id', true],
      ])
      .filtered(
        `${obj.sortingColumn} < $0 || (${obj.sortingColumn} == $0 && _id ${
          obj.prev_page_cursorId ? '<=' : '<'
        } $1) LIMIT(${limit + 1})`,
        obj.prev_page_filterCursor,
        obj.prev_page_cursorId,
      );
  } else {
    objects = objects
      .sorted('_id', true)
      .filtered(
        `_id ${obj.prev_page_cursorId ? '<=' : '<'} $0 LIMIT(${limit + 1})`,
        obj.prev_page_cursorId,
      );
  }
  return objects;
}

function getObjectsDescending(
  obj: getObjectsQuery,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  if (obj.sortingColumn) {
    obj.filterCursor =
      obj.filterCursor ??
      objects.sorted(`${obj.sortingColumn}`, true)[0][obj.sortingColumn];
    objects = objects
      .sorted([
        [`${obj.sortingColumn}`, true],
        ['_id', true],
      ])
      .filtered(
        `${obj.sortingColumn} < $0 || (${obj.sortingColumn} == $0 && _id ${
          obj.cursorId ? '<=' : '<'
        } $1) LIMIT(${limit + 1})`,
        obj.filterCursor,
        obj.prev_page_cursorId ?? obj.cursorId,
      );
    if (obj.prev_page_cursorId) {
      objects = objects.sorted([
        [`${obj.sortingColumn}`, false],
        ['_id', false],
      ]);
    }
  } else {
    objects = objects
      .sorted('_id', true)
      .filtered(
        `_id ${obj.cursorId ? '<=' : '<'} $0 LIMIT(${limit + 1})`,
        obj.prev_page_cursorId ?? obj.cursorId,
      );
  }
  return objects;
}

function getObjectsAscending(
  obj: getObjectsQuery,
  objects: Realm.Results<Realm.Object>,
  limit: number,
) {
  if (obj.sortingColumn) {
    obj.filterCursor =
      obj.filterCursor ??
      objects.sorted(`${obj.sortingColumn}`, false)[0][obj.sortingColumn];
    objects = objects
      .sorted([
        [`${obj.sortingColumn}`, false],
        ['_id', false],
      ])
      .filtered(
        `${obj.sortingColumn} > $0 || (${obj.sortingColumn} == $0 && _id ${
          obj.cursorId ? '>=' : '>'
        } $1) LIMIT(${limit + 1})`,
        obj.filterCursor,
        obj.cursorId,
      );
  } else {
    objects = objects
      .sorted('_id', false)
      .filtered(
        `_id ${obj.cursorId ? '>=' : '>'} $0 LIMIT(${limit + 1})`,
        obj.cursorId,
      );
  }
  return objects;
}
