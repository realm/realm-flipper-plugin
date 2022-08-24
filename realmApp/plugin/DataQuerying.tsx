import {Flipper} from 'react-native-flipper';
import {BSON} from 'realm';
import {convertObjects} from './ConvertFunctions';
import {RealmFlipperPlugin} from './RealmPlugin';
const {UUID} = BSON;
export const registerDataQuerying = (
  plugin: RealmFlipperPlugin,
  connection: Flipper.FlipperConnection,
) => {
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

  connection.receive('receivedCurrentQuery', obj => {
    console.log('received');
    const realm = plugin.realmsMap.get(obj.realm);
    if (plugin.schemaToObjects.has(obj.schema)) {
      plugin.schemaToObjects.get(obj.schema).removeAllListeners();
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
    plugin.schemaToObjects.set(obj.schema, objectsToListenTo);
  });

  connection.receive('getObjects', obj => {
    const realm = plugin.realmsMap.get(obj.realm);
    const schema = obj.schema;
    if (!realm) {
      return;
    }
    let objects = realm.objects(schema);
    console.error('tragedy, ', objects[0].ObjectList)
    console.error('right after selecting', objects[0].uuid instanceof UUID);
    // const afterConvert = convertObjects(objects, schema, realm.schema);
    // console.log('after:', afterConvert[0]);
    if (!objects.length) {
      connection.send('getObjects', {
        objects: [],
        total: null,
        next_cursor: null,
        prev_cursor: null,
      });
      return;
    }
    // new UUID()
    if (plugin.schemaToObjects.has(schema)) {
      plugin.schemaToObjects.get(schema).removeAllListeners();
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
    plugin.schemaToObjects.set(schema, objectsToListenTo);

    let limit = obj.limit || plugin.DEFAULT_PAGE_SIZE;
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
    console.error('in here, :', objects[0].uuid instanceof UUID)
    const newObjects = convertObjects(
      objects,
      realm.schema.find(schemaa => schemaa.name === schema),
      realm.schema,
    );
    // );
    console.error('after all, sending: ', newObjects)
    connection.send('getObjects', {
      objects: newObjects,
      total: objectsLength,
      next_cursor: lastItem,
      prev_cursor: firstItem,
    });
  });

  connection.receive(
    'getOneObject',
    (obj: {realm: string; schema: string; primaryKey: string}, responder) => {
      const realm = plugin.realmsMap.get(obj.realm);
      const schemaObj = realm?.schema.find(s => s.name === obj.schema);
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

      if (!realm) {
        return;
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

  connection.receive('executeQuery', (obj, responder) => {
    const realm = plugin.realmsMap.get(obj.realm);
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
