import {Flipper} from 'react-native-flipper';
import Realm, {
  CanonicalObjectSchema,
  CanonicalObjectSchemaProperty,
} from 'realm';

const {BSON} = Realm;
// config: Configuration,
//     realms: Realm[],
//     this.connection: Flipper.Flipperthis.connection,

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
    // const schemaObj = realm.schema.find(schema => schema.name === typeName);
    // let objectType;
    // if (schemaObj) {
    //   // if found the schema, then we are dealing with an object
    //   typeName = 'object';
    //   objectType = schemaObj.name;
    // }
    console.log(value);
    switch (type) {
      case 'object':
        return readObject(objectType as string, value);
      case 'uuid':
        return new BSON.UUID(value);
      case 'decimal128':
        return new BSON.Decimal128(value);
      case 'objectID':
        return new BSON.ObjectId(value);
      case 'data':
        const typedArray = Uint8Array.from(value);
        return typedArray.buffer;
      default:
        // console.log('returning default', value)
        return value;
    }
  };

  // console.log('converting...', object);
  const convertRoot = (val: any, property: CanonicalObjectSchemaProperty) => {
    console.log('convertRoot', val, property);

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
    // console.log('type is', type, 'for key', value[0]);
    // console.log('type is', type);
    obj[value[0]] = convertRoot(value[1], type);
    // console.log('value for', value[0], ' is ', obj[value[0]]);
  });
  return obj;
};

export class RealmPlugin {
  realms: Realm[] = [];
  connection: Flipper.FlipperConnection;
  realmsMap = new Map<string, Realm>();
  DEFAULT_PAGE_SIZE = 100; //research right size for 0.5 second load time or possibly use a different variable.
  schemaToObjects: Map<string, Realm.Results<Realm.Object>>;
  constructor(realms, connection) {
    console.log('RELOAD, RELOAD, RELOAD');
    this.realms = realms;
    this.connection = connection;
    realms.forEach(realm => {
      this.realmsMap.set(realm.path, realm);
    });
    this.schemaToObjects = new Map<string, Realm.Results<Realm.Object>>();
  }

  connectPlugin() {
    console.log(this.connection);
    if (!this.connection) {
      return;
    }
    this.connection.receive('getRealms', () => {
      this.connection.send('getRealms', {
        realms: Array.from(this.realmsMap.keys()),
      });
    });

    this.connection.receive('getObjects', obj => {
      const realm = this.realmsMap.get(obj.realm);
      const schema = obj.schema;
      if (!realm) {
        return;
      }
      let objects = realm.objects(schema);
      if (!objects.length) {
        this.connection.send('getObjects', {
          objects: objects,
          total: null,
          next_cursor: null,
          prev_cursor: null,
        });
        return;
      }
      console.log('schemaToObjects', this.schemaToObjects);
      if (this.schemaToObjects.has(schema)) {
        console.log('removing all listeners from ', schema);
        this.schemaToObjects.get(schema).removeAllListeners();
      }
      console.log('adding listener to', schema);
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
      this.schemaToObjects.set(schema, objectsToListenTo);
      let limit = obj.limit || this.DEFAULT_PAGE_SIZE;
      limit < 1 ? (limit = 20) : {};
      const objectsLength = objects.length;
      if (obj.backwards) {
        objects = this.getObjectsByPaginationBackwards(obj, objects, limit);
      } else {
        objects = this.getObjectsByPagination(obj, objects, limit);
      }
      let lastItem, firstItem;
      if (objects.length) {
        lastItem = objects[objects.length - 1]; //if this is null this is the last page
        firstItem = objects[0];
      }
      //base64 the next and prev cursors

      this.connection.send('getObjects', {
        objects: objects,
        total: objectsLength,
        next_cursor: lastItem,
        prev_cursor: firstItem,
      });
    });

    this.connection.receive(
      'getOneObject',
      (obj: {realm: string; schema: string; primaryKey: string}) => {
        const realm = this.realmsMap.get(obj.realm);

        const schema = obj.schema;
        if (!realm) {
          return;
        }

        const object = realm.objectForPrimaryKey(schema, obj.primaryKey);

        this.connection.send('getOneObject', {object: object});
      },
    );

    this.connection.receive('getSchemas', obj => {
      const realm = this.realmsMap.get(obj.realm);
      if (!realm) {
        return;
      }
      const schemas = realm.schema;
      this.connection.send('getSchemas', {schemas: schemas});
    });

    this.connection.receive('executeQuery', (obj, responder) => {
      const realm = this.realmsMap.get(obj.realm);
      if (!realm) {
        return;
      }
      const objs = realm.objects(obj.schema);
      if (obj.query === '') {
        responder.success(objs);
        // this.connection.send('executeQuery', {result: objs});
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
      // this.connection.send('executeQuery', res);
    });
    this.connection.receive('addObject', obj => {
      const realm = this.realmsMap.get(obj.realm);
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
      this.connection.send('getObjects', {objects: objects});
    });
    this.connection.receive('modifyObject', obj => {
      // console.log('modify', obj)
      const realm = this.realmsMap.get(obj.realm);
      if (!realm) {
        return;
      }
      console.log('got', obj.object);
      const converted = typeConverter(obj.object, realm, obj.schema);
      console.log('converted', converted);
      realm.write(() => {
        realm.create(obj.schema, converted, 'modified');
      });

      const objects = realm.objects(obj.schema);
      this.connection.send('getObjects', {objects: objects});
    });
    this.connection.receive('removeObject', (obj, responder) => {
      const realm = this.realmsMap.get(obj.realm);
      if (!realm) {
        return;
      }

      const schema = realm.schema.find(schema => schema.name === obj.schema);
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
      this.connection.send('getObjects', {objects: objects});
    });

    const onObjectsChange = (objects, changes) => {
      console.log('changes', changes);
      changes.deletions.forEach(index => {
        if (this.connection) {
          const smallerNeighbor = objects[index - 1];
          const largerNeighbor = objects[index];
          this.connection.send('liveObjectDeleted', {
            smallerNeighbor: smallerNeighbor?._id,
            largerNeighbor: largerNeighbor?._id,
            index: index,
          });
        }
      });

      changes.insertions.forEach(index => {
        const inserted = objects[index];
        const smallerNeighbor = objects[index - 1];
        const largerNeighbor = objects[index + 1];
        if (this.connection) {
          this.connection.send('liveObjectAdded', {
            newObject: inserted,
            index: index,
            smallerNeighbor: smallerNeighbor?._id,
            largerNeighbor: largerNeighbor?._id,
          });
        }
      });

      changes.modifications.forEach(index => {
        const modified = objects[index];
        if (this.connection) {
          this.connection.send('liveObjectEdited', {
            newObject: modified,
            index: index,
          });
        }
      });
    };
  }

  getObjectsByPagination(
    obj: getObjectsQuery,
    objects: Realm.Results<Realm.Object>,
    limit: number,
  ) {
    const shouldSortDescending = obj.sortDirection === 'descend';
    obj.cursorId =
      obj.cursorId ?? objects.sorted('_id', shouldSortDescending)[0]._id;
    if (shouldSortDescending) {
      objects = this.getObjectsDescending(obj, objects, limit);
    } else {
      objects = this.getObjectsAscending(obj, objects, limit);
    }
    return objects;
  }

  getObjectsByPaginationBackwards(
    obj: getObjectsQuery,
    objects: Realm.Results<Realm.Object>,
    limit: number,
  ) {
    const shouldSortDescending = obj.sortDirection === 'descend';
    obj.prev_page_cursorId =
      obj.prev_page_cursorId ??
      objects.sorted('_id', shouldSortDescending)[0]._id;
    if (shouldSortDescending) {
      objects = this.getPrevObjectsDescending(obj, objects, limit);
    } else {
      objects = this.getPrevObjectsAscending(obj, objects, limit);
    }
    return objects;
  }

  getPrevObjectsDescending(
    obj: getObjectsQuery,
    objects: Realm.Results<Realm.Object>,
    limit: number,
  ) {
    if (obj.sortingColumn) {
      const filterCursor =
        obj.prev_page_filterCursor ??
        objects.sorted(`${obj.sortingColumn}`, false)[0][obj.sortingColumn];
      objects = objects
        .sorted([
          [`${obj.sortingColumn}`, false],
          ['_id', false],
        ])
        .filtered(
          `${obj.sortingColumn} ${
            !obj.prev_page_filterCursor ? '>=' : '>'
          } $0 || (${obj.sortingColumn} == $0 && _id ${
            obj.cursorId ? '>=' : '>'
          } $1) LIMIT(${limit + 1})`,
          filterCursor,
          obj.prev_page_cursorId,
        );
    } else {
      objects = objects
        .sorted('_id', false)
        .filtered(
          `_id ${obj.prev_page_cursorId ? '>=' : '>'} $0 LIMIT(${limit + 1})`,
          obj.prev_page_cursorId,
        );
    }
    if (obj.prev_page_filterCursor) {
      objects = objects.sorted([
        [`${obj.sortingColumn}`, true],
        ['_id', true],
      ]);
    } else if (obj.prev_page_cursorId) {
      objects = objects.sorted('_id', true);
    }
    return objects;
  }

  getPrevObjectsAscending(
    obj: getObjectsQuery,
    objects: Realm.Results<Realm.Object>,
    limit: number,
  ) {
    if (obj.sortingColumn) {
      objects.findIndex;
      const filterCursor =
        obj.filterCursor ??
        objects.sorted(`${obj.sortingColumn}`, true)[0][obj.sortingColumn];
      objects = objects
        .sorted([
          [`${obj.sortingColumn}`, true],
          ['_id', true],
        ])
        .filtered(
          `${obj.sortingColumn} ${
            !obj.prev_page_filterCursor ? '<=' : '<'
          } $0 || (${obj.sortingColumn} == $0 && _id ${
            obj.prev_page_cursorId ? '<=' : '<'
          } $1) LIMIT(${limit + 1})`,
          filterCursor,
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

  getObjectsDescending(
    obj: getObjectsQuery,
    objects: Realm.Results<Realm.Object>,
    limit: number,
  ) {
    if (obj.sortingColumn) {
      const filterCursor =
        obj.filterCursor ??
        objects.sorted(`${obj.sortingColumn}`, true)[0][obj.sortingColumn];
      objects = objects
        .sorted([
          [`${obj.sortingColumn}`, true],
          ['_id', true],
        ])
        .filtered(
          `${obj.sortingColumn} ${!obj.filterCursor ? '<=' : '<'} $0 || (${
            obj.sortingColumn
          } == $0 && _id ${obj.cursorId ? '<=' : '<'} $1) LIMIT(${limit + 1})`,
          filterCursor,
          obj.cursorId,
        );
    } else {
      objects = objects
        .sorted('_id', true)
        .filtered(
          `_id ${obj.cursorId ? '<=' : '<'} $0 LIMIT(${limit + 1})`,
          obj.cursorId,
        );
    }
    return objects;
  }

  getObjectsAscending(
    obj: getObjectsQuery,
    objects: Realm.Results<Realm.Object>,
    limit: number,
  ) {
    if (obj.sortingColumn) {
      const filterCursor =
        obj.filterCursor ??
        objects.sorted(`${obj.sortingColumn}`, false)[0][obj.sortingColumn];
      objects = objects
        .sorted([
          [`${obj.sortingColumn}`, false],
          ['_id', false],
        ])
        .filtered(
          `${obj.sortingColumn} ${!obj.filterCursor ? '>=' : '>'} $0 || (${
            obj.sortingColumn
          } == $0 && _id ${obj.cursorId ? '>=' : '>'} $1) LIMIT(${limit + 1})`,
          filterCursor,
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
}
