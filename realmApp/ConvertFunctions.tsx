// let JSObject = Object;
import {CanonicalObjectSchema, Object as RealmObject} from 'realm';

type PropertyDescription = {
  type: string;
  objectType?: string;
};

// [keys: string]: CanonicalObjectSchemaProperty

const convertObject = (
  object: RealmObject,
  properties: {
    [keys: string]: PropertyDescription;
  },
  schemas: CanonicalObjectSchema[],
) => {
  const replacer = (key, value) => {
    if (!key) {
      return value;
    }
    const property = properties[key] as PropertyDescription;
    if (!property) {
      return value;
    }
    if (property.type === 'data') {
      // console.log('value of data is:', )
      // console.log('value is:', new Uint8Array(value));
      return Array.from(new Uint8Array(value));
    }
    if (property.type === 'mixed') {
      return value;
    } else {
      return value;
    }
  };

  return JSON.parse(JSON.stringify(object, replacer));
};

export const convertObjects = (
  objects: RealmObject[],
  schema: CanonicalObjectSchema,
  schemas: CanonicalObjectSchema[],
) => {
  return objects.map(obj => convertObject(obj, schema.properties, schemas));
};
