// type PropertyDescription

import { fromJSON } from 'flatted';
import { DeserializedRealmObject, SerializedRealmObject } from '../CommonTypes';

export const deserializeRealmObject = (
  receivedObject: SerializedRealmObject,
  schema: Realm.CanonicalObjectSchema,
) => {
  if(receivedObject.realmObject == undefined) {
    return receivedObject;
  }
  const properties = schema.properties;
  const convertedObject: DeserializedRealmObject = {
    objectKey: receivedObject.objectKey,
    objectType: receivedObject.objectType,
    realmObject: fromJSON(receivedObject.realmObject),
  };
  Object.entries(convertedObject.realmObject).forEach(([key, value]) => {
    const property = properties[key];
    if (property && property.type === 'data') {
      convertedObject.realmObject[key] = {
        length: (value as Record<'$binaryData', number>).$binaryData,
        info: [schema.name, receivedObject.objectKey, property.name],
      };
    } else {
      convertedObject.realmObject[key] = value;
    }
  });
  return convertedObject;
};

export const deserializeRealmObjects = (
  serializedObjects: SerializedRealmObject[],
  schema: Realm.CanonicalObjectSchema,
) => {
  return serializedObjects.map((object) => deserializeRealmObject(object, schema));
};
