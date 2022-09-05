import { RealmObject, SchemaObject } from '../CommonTypes';

// type PropertyDescription 

const convertObject = (
  object: RealmObject,
  schema: SchemaObject,
  downloadData: (schema: string, objectKey: number, propertyName: string) => Promise<Uint8Array>,
) => {
  const properties = schema.properties;
  const newObj: RealmObject = {};
  Object.keys(object).forEach(key => {
    const value = object[key];

    const property = properties[key];
    if (property && property.type == 'data') {
      console.log('downloadData:', downloadData)
      newObj[key] = {
        length: (value as Record<"$binaryData", number>).$binaryData,
        downloadData: () => downloadData(schema.name, Number(object._objectKey), property.name),
      }
    }
    else {
      newObj[key] = value;
    }
  });
  return newObj;
};

export const convertObjects = (
  objects: RealmObject[],
  schema: SchemaObject,
  downloadData: (schema: string, primaryKey: unknown, propertyName: string) => Promise<Uint8Array>,
) => {
  return objects.map(v => convertObject(v, schema, downloadData));
};
