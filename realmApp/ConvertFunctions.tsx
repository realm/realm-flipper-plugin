// let JSObject = Object;
import {
  BSON,
  CanonicalObjectSchema,
  CanonicalObjectSchemaProperty,
  Object as RealmObject,
} from 'realm';

type PropertyDescription = {
  type: string;
  objectType?: string;
};

// [keys: string]: CanonicalObjectSchemaProperty

const convertObjectToDesktop = (
  object: RealmObject,
  properties: {
    [keys: string]: PropertyDescription;
  },
  // schemas: CanonicalObjectSchema[],
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
      return {
        $binaryData: value.byteLength,
      };
    }
    if (property.type === 'mixed') {
      return value;
    } else {
      return value;
    }
  };

  let after = JSON.parse(JSON.stringify(object, replacer));
  after['_objectKey'] = object._objectKey();
  return after;
};

export const convertObjectsToDesktop = (
  objects: RealmObject[],
  schema: CanonicalObjectSchema,
) => {
  return objects.map(obj => convertObjectToDesktop(obj, schema.properties));
};

// OBJECT FROM DESKTOP TO REALM TYPES
/*
the other way around complicated because we send entire inner objects
if that's not the case, can be changed to shallow conversion of all the properties
*/
export const convertObjectsFromDesktop = (
  objects: RealmObject[],
  realm: Realm,
  schemaName?: string,
) => {
  return objects.map(obj => convertObjectFromDesktop(obj, realm, schemaName));
};
// convert object from a schema to realm one
const convertObjectFromDesktop = (
  object: any,
  realm: Realm,
  schemaName?: string,
) => {
  delete object._objectKey;
  // console.log('object:', object, schemaName);
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
        // console.log('data with value:', typeof value.length);
        const arr = new Uint8Array(value);
        return arr;
      default:
        // console.log('returning default', value)
        return value;
    }
  };

  const convertRoot = (val: any, property: CanonicalObjectSchemaProperty) => {
    if (val === null) {
      return null;
    }
    console.log('got type', property);
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
