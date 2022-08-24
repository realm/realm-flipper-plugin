import {Flipper} from 'react-native-flipper';
import Realm, {
  CanonicalObjectSchema,
  CanonicalObjectSchemaProperty,
} from 'realm';
import {registerDataQuerying} from './DataQuerying';
import {registerObjectManipulation} from './ObjectManipulation';

const {BSON} = Realm;

// convert object from a schema to realm one
const typeConverter = (object: any, realm: Realm, schemaName?: string) => {
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
    console.log('convertLeaf', value, type);

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
        // console.log('data')
        return new ArrayBuffer(6);
      // const buffer = new ArrayBuffer()
      // const typedArray = Uint8Array.from(value);
      // return new BSON.Binary(typedArray);
      // return typedArray.buffer;
      // return typedArray.buffer;
      default:
        // console.log('returning default', value)
        return value;
    }
  };

  // console.log('converting...', object);
  const convertRoot = (val: any, property: CanonicalObjectSchemaProperty) => {
    if (val === null) {
      return null;
    }
    // console.log('got type', type);
    switch (property.type) {
      case 'set':
        console.log('received set:', val);
        // due to a problem with serialization, Set is being passed over as a list
        const realVal = (val as any[]).map(value => {
          return convertLeaf(value, property.objectType);
        });
        return realVal;
      case 'list':
        console.log('prop:', property, ' val:', val);
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

const modifyObject = (object: any, schemaName: string, realm: Realm) => {
  const schemaObj = realm.schema.find(
    schema => schema.name === schemaName,
  ) as CanonicalObjectSchema;

  console.log('object before', schemaName);
  Object.entries(object).forEach((value: [string, unknown]) => {
    const type = schemaObj.properties[value[0]];
    console.log('handling val: ', value, 'of type', type);
    switch (type.name) {
      case 'data':
        const array = value[1] as ArrayBuffer;
        console.log('array found is', array);
        const view = new Uint8Array(array);
        let result: number[] = [];
        for (let i = 0; i < view.length; i++) {
          result = [...result, view[i]];
        }
        object[value[0]] = result;
        break;
      case 'list':
      case 'dictionary':
      case 'set':
      case 'object':
        // TODO: handle recursive stuff
        break;
      default:
        break;
    }
  });
  // console.log('object after', object);
};

const modifyObjects = (objects: any[], schemaName: string, realm: Realm) => {
  console.log('modifying', objects.length, 'objects');
  objects.forEach(obj => {
    modifyObject(obj, schemaName, realm);
  });
};

type RealmDescription = (Realm | Realm.Configuration)[];

export class RealmFlipperPlugin implements Flipper.FlipperPlugin {
  constructor(realmDescription: RealmDescription[]) {
    this.realmsMap = new Map();
    this.realmsToClose = [];
    realmDescription.forEach(description => {
      if (description instanceof Realm) {
        this.realmsMap.set(description.path, description);
      } else {
        const realm = new Realm(description as Realm.Configuration);
        this.realmsMap.set(realm.path, realm);
        this.realmsToClose.push(realm);
      }
    });
    this.schemaToObjects = new Map();
  }
  realmsToClose: Realm[];

  readonly DEFAULT_PAGE_SIZE = 100; //research right size for 0.5 second load time or possibly use a different variable.
  realmsMap: Map<string, Realm>;
  schemaToObjects: Map<string, Realm.Results<Realm.Object>>;

  getId() {
    return 'realm';
  }

  onConnect(connection) {
    connection.send('getCurrentQuery');

    connection.receive('getRealms', () => {
      connection.send('getRealms', {
        realms: Array.from(this.realmsMap.keys()),
      });
    });

    connection.receive('getSchemas', obj => {
      const realm = this.realmsMap.get(obj.realm);
      if (!realm) {
        return;
      }
      const schemas = realm.schema;
      // for (let schema of realm.schema) {
      //   const objects = realm.objects(schema.name);
      //   if (schemaToObjects.has(schema.name)) {
      //     console.log('removing all listeners from ', schema.name);
      //     schemaToObjects.get(schema.name).removeAllListeners();
      //   }
      //   console.log('adding listener to', schema.name);
      //   objects.addListener(onObjectsChange);
      //   schemaToObjects.set(schema.name, objects);
      // }
      connection.send('getSchemas', {schemas: schemas});
    });
    registerObjectManipulation(this, connection);
    registerDataQuerying(this, connection);
  }
  onDisconnect() {
    for (let objects of this.schemaToObjects.values()) {
      objects.removeAllListeners();
    }
    // this.realmsToClose.forEach(value => {
    //   value.close();
    // });
  }
}
