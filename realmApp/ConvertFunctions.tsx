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
    if (property.type === 'mixed') {
      // console.log('got mixed:', value, 'with type:', typeof value);
      // //   console.log('value is', value instanceof Date, ' a Date');
      // console.log(
      //   'methods:',
      //   value !== null ? Object.getOwnPropertyNames(value) : undefined,
      // );
      return value;
    } else {
      return value;
    }
  };

  return JSON.stringify(object, replacer);
};

export const convertObjects = (
  objects: RealmObject[],
  schema: CanonicalObjectSchema,
  schemas: CanonicalObjectSchema[],
) => {
  return objects.map(obj => convertObject(obj, schema.properties, schemas));
};
