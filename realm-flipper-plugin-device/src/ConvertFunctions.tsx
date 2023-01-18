import {
  BSON,
  CanonicalObjectSchema,
  CanonicalObjectSchemaProperty,
  Object as RealmObject,
  ObjectSchema,
} from 'realm';
import {toJSON} from 'flatted';
import { PlainRealmObject, SerializedRealmObject } from '../SharedTypes';


/** Helper to recursively serialize Realm objects and embedded objects into plain JavaScript objects. */
const serializeObject = (realmObject: RealmObject, objectSchema: Realm.ObjectSchema): Record<string, unknown> => {
  const properties = objectSchema.properties;
  const jsonifiedObject = realmObject.toJSON();

  Object.keys(properties).forEach(key => {
    const property = properties[key];

    //@ts-expect-error The field will exist on the Realm object
    const propertyValue = realmObject[key];
    const propertyType = typeof property == "string" ? property : property.type;
    const objectType = typeof property == "string" ? undefined : property.objectType;

    if (propertyValue) {
      // Handle cases of property types where different information is needed than 
      // what is given from the default `toJSON` serialization.
      switch(propertyType) {
        case "set":
        case "list":
          // TODO: is there a better way to determine whether this is a list of objects?
          if(objectType != "mixed"
          && propertyValue && (propertyValue as any[]).length > 0
          && propertyValue[0].objectSchema) {
            // let schema = propertyValue.objectSchema() as ObjectSchema;
            jsonifiedObject[key] = (propertyValue as RealmObject[]).map(
              (object) => {return {objectKey: object._objectKey(), objectType}},
            )
          }
          break;
        case "object":
          const objectKey = propertyValue._objectKey();
          const isEmbedded = (propertyValue.objectSchema() as ObjectSchema).embedded
          if (!isEmbedded) {
            // If the object is linked (not embedded), store only the object key and type
            // as a seperate key for later plugin lazy loading reference
            jsonifiedObject[key] = {objectKey, objectType} as SerializedRealmObject;
          } else {
            jsonifiedObject[key] = serializeObject(propertyValue as Realm.Object, propertyValue.objectSchema());
          }
          break;
        case "data":
          jsonifiedObject[key] = {
            $binaryData: (propertyValue as Realm.Types.Data)?.byteLength,
          }
          break;
        case "mixed":
          // TODO: better mixed type support. This likely does not properly cover all scenarios.
          if(propertyValue && propertyValue.objectSchema) {
            jsonifiedObject[key] = serializeObject(propertyValue, propertyValue.objectSchema());
          }
          break;
      }
    }
  });
  return jsonifiedObject;
}

/** Serialized a given Realm Object into a SerializedRealmObject, providing circular dependency safe format. */
export const serializeRealmObject = (
  realmObject: Realm.Object,
  objectSchema: ObjectSchema,
): SerializedRealmObject => {
  return {
    objectKey: realmObject._objectKey(),
    // flatted.toJSON is used to ensure circular objects can get stringified by flipper plugin.
    realmObject: toJSON(serializeObject(realmObject, objectSchema)),
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
  objects: PlainRealmObject[],
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
    const objectKey = value.objectKey;
    if (objectKey !== undefined) {
      //@ts-expect-error _objectForObjectKey is not public.
      return realm._objectForObjectKey(objectType, objectKey);
    }
    // have to use primary key, walkaround for #105
    const schema = realm.schema.find(
      schemaObj => schemaObj.name === objectType,
    ) as CanonicalObjectSchema;
    if(schema.embedded) {
      return value;
    }
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
        return (val as unknown[]).map(value => {
          return convertLeaf(value, property.objectType);
        });
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
