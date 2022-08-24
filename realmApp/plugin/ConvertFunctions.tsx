// let JSObject = Object;
import {CanonicalObjectSchema, List, Object as RealmObject, Set} from 'realm';
import {UUID, EJSON, ObjectID} from 'bson';
// import {Set} from "realm";
type PropertyDescription = {
  type: string;
  objectType?: string;
};

// [keys: string]: CanonicalObjectSchemaProperty

const convertObject = (object: any) => {
  if (object instanceof UUID) {
    return {
      $uuid: object ? object.toHexString() : null,
    };
  }
  if (object === null) {
    return null;
  }
  // console.error('beginning', object.ObjectList)
  const after = new Object();
  const keys = Object.keys(JSON.parse(JSON.stringify(object)));
  // const afterUUID = Object.assign({}, object);
  keys.forEach(key => {
    const val = object[key];
    if (val instanceof Date || val instanceof ObjectID) {
      after[key] = val;
    } else if (val instanceof List || val instanceof Set) {
      let newList = val.map(value => convertObject(value));
      after[key] = newList;
    } else if (val instanceof UUID) {
      console.log('im in here! the value is:', val);
      after[key] = convertObject(val);
      console.log(`after[${key}] set to`, after[key]);
    } else if (val instanceof Object && val.objectSchema) {
      const schema = val.objectSchema();
      const primaryKey = val[schema.primaryKey];
      after[key] = {
        key: convertObject(primaryKey),
        schema: schema.name,
      };
    } else {
      after[key] = val;
    }
  });
  // console.log(object);
  // console.log('beffore ser:', after.mixed);
  const res = EJSON.serialize(after, {
    relaxed: false,
  });
  // console.log('right after:', Object.keys(after));
  // console.log('new uuid is:', res.objectList);
  return res;
};

export const convertObjects = (
  objects: RealmObject[],
  schema: CanonicalObjectSchema,
  schemas: CanonicalObjectSchema[],
) => {
  return objects.map(obj => convertObject(obj));
};
