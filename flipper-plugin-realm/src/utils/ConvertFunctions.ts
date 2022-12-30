// type PropertyDescription

import { IndexableRealmObject } from '../CommonTypes';

const convertObject = (
  object: IndexableRealmObject,
  schema: Realm.CanonicalObjectSchema,
  downloadData: (
    schema: string,
    objectKey: string,
    propertyName: string,
  ) => Promise<Uint8Array>,
) => {
  const properties = schema.properties;
  const newObj: IndexableRealmObject = Object();
  Object.keys(object).forEach((key) => {
    const value = object[key];

    const property = properties[key];
    if (property && property.type === 'data') {
      newObj[key] = {
        length: (value as Record<'$binaryData', number>).$binaryData,
        downloadData: () =>
          downloadData(schema.name, object._pluginObjectKey, property.name),
      };
    } else {
      newObj[key] = value;
    }
  });
  return newObj;
};

export const convertObjects = (
  objects: IndexableRealmObject[],
  schema: Realm.CanonicalObjectSchema,
  downloadData: (
    schema: string,
    objectKey: string,
    propertyName: string,
  ) => Promise<Uint8Array>,
) => {
  return objects.map((v) => convertObject(v, schema, downloadData));
};
