// let JSObject = Object;
import {
  BSON,
  CanonicalObjectSchema,
  CanonicalObjectSchemaProperty,
  Object as RealmObject,
} from "realm";

type PropertyDescription = {
  type: string;
  objectType?: string;
};

const convertObjectToDesktop = (
  object: RealmObject,
  properties: {
    [keys: string]: PropertyDescription;
  }
) => {
  const obj = {};
  Object.keys(properties).forEach((key) => {
    const property = properties[key] as PropertyDescription;
    // make a copy of the object
    obj[key] = object.toJSON()[key];

    if (property.type === "object" && obj[key]) {
      const objectKey = object[key]._objectKey();
      obj[key]._objectKey = objectKey;
    }
  });
  const replacer = (key, value) => {
    if (!key) {
      return value;
    }
    const property = properties[key] as PropertyDescription;
    if (!property) {
      return value;
    }
    if (property.type === "data") {
      return {
        $binaryData: value?.byteLength,
      };
    } else if (property.type === "mixed") {
      return value;
    } else {
      return value;
    }
  };

  let after;
  try {
    after = JSON.parse(JSON.stringify(obj, replacer));
  } catch (err) {
    // a walkaround for #85
    return {};
  }
  // save so that it's sent over -> serialization would remove a function
  after._objectKey = object._objectKey();
  return after;
};

export const convertObjectsToDesktop = (
  objects: RealmObject[],
  schema: CanonicalObjectSchema
) => {
  return objects.map((obj) => convertObjectToDesktop(obj, schema.properties));
};

/*
OBJECT FROM DESKTOP TO REALM TYPES
the other way around complicated because we send entire inner objects
if that's not the case, can be changed to shallow conversion of all the properties
*/
export const convertObjectsFromDesktop = (
  objects: RealmObject[],
  realm: Realm,
  schemaName?: string
) => {
  return objects.map((obj) => convertObjectFromDesktop(obj, realm, schemaName));
};
// convert object from a schema to realm one
const convertObjectFromDesktop = (
  object: any,
  realm: Realm,
  schemaName?: string
) => {
  delete object._objectKey;
  if (!schemaName) {
    throw new Error("Converting with missing schema name");
  }
  const readObject = (objectType: string, value: any) => {
    if (value === null) {
      return null;
    }
    const objectKey = value._objectKey;
    if (objectKey !== undefined) {
      return realm._objectForObjectKey(objectType, objectKey);
    }
    // have to use primary key, walkaround for #105
    const schemaObject = realm.schema.find(
      (schemaObj) => schemaObj.name === objectType
    ) as CanonicalObjectSchema;

    let primaryKey = object[schemaObject.primaryKey as string];
    if (
      schemaObject.properties[schemaObject.primaryKey as string].type === "uuid"
    ) {
      primaryKey = new BSON.UUID(primaryKey);
    }
    return realm.objectForPrimaryKey(objectType, primaryKey);
  };

  const convertLeaf = (value: any, type: string, objectType?: string) => {
    if (realm.schema.some((schemaObj) => schemaObj.name === type)) {
      return readObject(type, value);
    }

    switch (type) {
      case "object":
        return readObject(objectType as string, value);
      case "uuid":
        return new BSON.UUID(value);
      case "decimal128":
        return new BSON.Decimal128(value);
      case "objectId":
        return new BSON.ObjectId(value);
      case "data":
        const arr = new Uint8Array(value);
        return arr;
      default:
        return value;
    }
  };

  const convertRoot = (val: any, property: CanonicalObjectSchemaProperty) => {
    if (val === null) {
      return null;
    }
    switch (property.type) {
      case "set":
        // due to a problem with serialization, Set is being passed over as a list
        const realVal = (val as any[]).map((value) => {
          return convertLeaf(value, property.objectType);
        });
        return realVal;
      case "list":
        return val.map((obj) => {
          return convertLeaf(obj, property.objectType as string);
        });
      case "dictionary":
        const res = {};
        Object.keys(val).forEach((key) => {
          res[key] = convertLeaf(val[key], property.objectType as string);
        });
        return res;
      case "object":
        return readObject(property.objectType as string, val);
      default:
        return convertLeaf(val, property.type, property.objectType);
    }
  };

  const schemaObj = realm.schema.find((schema) => schema.name === schemaName);

  const obj = {};
  Object.entries(object).forEach((value: [string, unknown]) => {
    const type = schemaObj?.properties[value[0]];
    obj[value[0]] = convertRoot(value[1], type);
  });
  return obj;
};