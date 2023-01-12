import {
  BSON,
  CanonicalObjectSchema,
  CanonicalObjectSchemaProperty,
  Object as RealmObject,
  ObjectSchema,
} from 'realm';
import {toJSON} from 'flatted';

/**
 * An interface containing refereence information about a Realm object sent
 * from the device plugin.
 */
export interface RealmObjectReference {
  // The object key of the stored Realm object
  objectKey: string;
  objectType?: string; 
}

/** 
 * An interface for receiving and sending Realm Objects between
 * the desktop plugin and the device.
 * @see DeserializedRealmObject
**/
export interface SerializedRealmObject extends RealmObjectReference {
  // Result of serializaing a Realm object from flatted.toJSON(realmObject.toJSON())
  realmObject: any;
}

export const serializeRealmObject = (
  realmObject: Realm.Object,
  objectSchema: ObjectSchema,
): SerializedRealmObject => {
  const properties = objectSchema.properties;
  const jsonifiedObject = realmObject.toJSON();

  Object.keys(properties).forEach(key => {
    const property = properties[key];

    //@ts-expect-error The field will exist on the Realm object
    const propertyValue = realmObject[key];
    const propertyType = typeof property == "string" ? property : property.type;

    if (propertyValue) {
      // Handle cases of property types where different information is needed than 
      // what is given from the default `toJSON` serialization.
      switch(propertyType) {
        case "object":
          const objectKey = propertyValue._objectKey();
          const objectType = typeof property == "string" ? property : property.objectType;
          const isEmbedded = (propertyValue.objectSchema() as ObjectSchema).embedded
          if (!isEmbedded) {
            // If the object is linked (not embedded), store only the object key and type
            // as a seperate key for later plugin lazy loading
            jsonifiedObject[key] = {objectKey, objectType} as SerializedRealmObject;
          } else {
            jsonifiedObject[key] = serializeRealmObject(jsonifiedObject[key] as Realm.Object, propertyValue.objectSchema());
          }
          break;
        case "data":
          jsonifiedObject[key] = {
            $binaryData: (propertyValue as Realm.Types.Data)?.byteLength,
          }
          break;
        case "mixed":
          jsonifiedObject[key] = propertyValue;
          break;
      }
    }
  });
  return {
    objectKey: realmObject._objectKey(),
    // flatted.toJSON is used to ensure circular objects can get stringified by Flutter.
    realmObject: toJSON(jsonifiedObject),
  };
};

export const serializeRealmObjects = (
  objects: RealmObject<Object>[],
  schema: ObjectSchema,
):SerializedRealmObject[] => {
  return objects.map(obj => serializeRealmObject(obj, schema));
};

/*
OBJECT FROM DESKTOP TO REALM TYPES
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
  if (!schemaName) {
    throw new Error('Converting with missing schema name');
  }
  const readObject = (objectType: string, value: any) => {
    if (value === null) {
      return null;
    }
    const objectKey = value._objectKey;
    if (objectKey !== undefined) {
      //@ts-expect-error _objectForObjectKey is not public.
      return realm._objectForObjectKey(objectType, objectKey);
    }
    // have to use primary key, walkaround for #105
    const schema = realm.schema.find(
      schemaObj => schemaObj.name === objectType,
    ) as CanonicalObjectSchema;

    let primaryKey = object[schema.primaryKey as string];
    if (schema.properties[schema.primaryKey as string].type === 'uuid') {
      primaryKey = new BSON.UUID(primaryKey);
    }
    return realm.objectForPrimaryKey(objectType, primaryKey);
  };

  const convertLeaf = (value: any, type: string, objectType?: string) => {
    if (realm.schema.some(schemaObj => schemaObj.name === type)) {
      return readObject(type, value);
    }

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
        const arr = new Uint8Array(value);
        return arr;
      default:
        return value;
    }
  };

  const convertRoot = (val: any, property: CanonicalObjectSchemaProperty) => {
    if (val === null || property === undefined) {
      return null;
    }
    switch (property.type) {
      case 'set':
        // due to a problem with serialization, Set is being passed over as a list
        const realVal = (val as unknown[]).map(value => {
          return convertLeaf(value, property.objectType);
        });
        return realVal;
      case 'list':
        return val.map((obj: unknown) => {
          return convertLeaf(obj, property.objectType as string);
        });
      case 'dictionary':
        const res: Record<string, unknown> = {};
        Object.keys(val).forEach(key => {
          res[key] = convertLeaf(val[key], property.objectType as string);
        });
        return res;
      case 'object':
        return readObject(property.objectType as string, val);
      default:
        return convertLeaf(val, property.type, property.objectType);
    }
  };

  const schemaObj = realm.schema.find(schema => schema.name === schemaName);

  const obj = Object();
  Object.entries(object).forEach((value: [string, unknown]) => {
    const type = schemaObj.properties[value[0]];
    obj[value[0]] = convertRoot(value[1], type);
  });
  return obj;
};
