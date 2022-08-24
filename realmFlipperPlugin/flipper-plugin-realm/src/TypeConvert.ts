import { CanonicalObjectSchema, List, Object as RealmObject } from 'realm';
import { UUID, EJSON, ObjectId } from 'bson';

type PropertyDescription = {
  type: string;
  objectType?: string;
};

// [keys: string]: CanonicalObjectSchemaProperty

const convertObject = (object: RealmObject) => {
  const afterUUID = { ...object };
  Object.keys(object).forEach((key) => {
    const val = object[key];
    if (val === null) {
      return;
    } else if (val instanceof ObjectId) {
      return;
    } else if (val instanceof Object && val.$uuid) {
      afterUUID[key] = new UUID(val.$uuid);
    } else if (val instanceof Object && val.$numberDecimal) {
        afterUUID[key] = val.$numberDecimal;
    }else if (val.map) {
        return val.map(convertObject);
    } else if (val instanceof Object) {
      afterUUID[key] = convertObject(val);
    }
  });
  return EJSON.deserialize(afterUUID);
};

export const convertObjects = (objects: RealmObject[]) => {
  return objects.map((obj) => convertObject(obj));
};
