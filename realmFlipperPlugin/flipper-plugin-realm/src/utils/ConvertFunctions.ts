import { RealmObject, SchemaObject } from '../CommonTypes';

// type PropertyDescription 

const convertObject = (
  object: RealmObject,
  schema: SchemaObject,
  downloadData: (schema: string, primaryKey: unknown, propertyName: string) => Promise<Uint8Array>,
) => {
  const properties = schema.properties;
  const newObj = {};
  const objKey = object._objectKey;
  Object.keys(object).forEach(key => {
    const value = object[key];

    const property = properties[key];
    if (property && property.type == 'data') {
      console.log('downloadData:', downloadData)
      newObj[key] = {
        length: value.$binaryData,
        downloadData: () => downloadData(schema.name, objKey, property.name),
      }
    }
    else {
      newObj[key] = value;
    }
  });
  newObj._objectKey = () => objKey;
  return newObj;
};

export const convertObjects = (
  objects: RealmObject[],
  schema: SchemaObject,
  downloadData: (schema: string, primaryKey: unknown, propertyName: string) => Promise<Uint8Array>,
) => {
  return objects.map(v => convertObject(v, schema, downloadData));
};
