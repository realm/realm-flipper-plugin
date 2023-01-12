const {UUID, Decimal128, ObjectId} = Realm.BSON;
import Realm from 'realm';

export function createAllTypesTestData(realm: Realm) {
  realm.write(() => {
    realm.delete(realm.objects('AllTypes'));
    realm.delete(realm.objects('NoPrimaryKey'));
  });

  let uuid = new UUID('aa79b9ed-fbc0-4038-8f16-31f4da3efb9e');
  const buffer = new ArrayBuffer(6);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < 6; i++) {
    view[i] = i;
  }

  let data1 = {
    _id: new UUID(),
    keyName: view,
  };
  realm.write(() => {
    realm.create('DataSchema', data1);
  });

  let AllTypes1 = {
    _id: uuid,
    bool: true,
    int: 888,
    float: 3.1415,
    double: 3.1415,
    string: 'string',
    decimal128: Decimal128.fromString('123456.123456789012345678901234567890'),
    //objectId: 'objectId',
    data: view,
    date: new Date('1995-12-17T03:24:00'),
    list: [1, 1, 2, 3, 5, 8, 13],
    //linkingObjects: 'linkingObjects',
    dictionary: {
      windows: 5,
      doors: 3,
      color: 'red',
      address: 'Summerhill St.',
      price: 400123,
    },
    set: [1, 2, 3, 4],
    mixed: new Date('2006-11-17T03:24:00'),
    uuid: new UUID(),
  };
  realm.write(() => {
    const t = realm.create('AllTypes', AllTypes1);
    //@ts-expect-error
    console.log('created alltypes', new Uint8Array(t.data));
  });

  let uuid2 = new UUID();

  let AllTypes2 = {
    _id: uuid2,
    bool: true,
    int: 2453,
    float: 6.51415,
    double: 34.13215,
    string: 'string',
    decimal128: Decimal128.fromString('0.000000000000000000008901234567890'),
    objectId: ObjectId.createFromHexString('507f191e810c19729de860ea'),
    data: buffer,
    date: new Date('2006-11-17T03:24:00'),
    list: [1, 1, 2, 3, 5, 8, 13],
    linkingObjects: realm.objectForPrimaryKey('AllTypes', uuid),
    dictionary: {
      windows: 5,
      doors: 3,
      color: 'red',
      address: 'Summerhill St.',
      price: 400123,
    },
    set: [1, 2, 3, 4],
    // mixed: realm.objectForPrimaryKey('AllTypes', uuid),
    uuid: new UUID(),
  };

  realm.write(() => {
    realm.create('AllTypes', AllTypes2);
  });

  let banana1id = Math.floor(Math.random() * 100000);

  let banana1 = {
    _id: banana1id,
    name: 'Jack',
    color: 'yellow',
    length: 40,
    weight: 500,
  };

  realm.write(() => {
    banana1 = realm.create('Banana', banana1);
    console.log(`created one banana: ${banana1.name} with id ${banana1._id}`);
  });

  const uuid3 = new UUID();

  let AllTypes3 = {
    _id: uuid3,
    bool: true,
    int: 2453,
    float: 6.51415,
    double: 34.13215,
    string: 'string',
    decimal128: Decimal128.fromString('0.000000000000000000008901234567890'),
    objectId: ObjectId.createFromHexString('507f191e810c19729de860ea'),
    data: buffer,
    date: new Date('2006-11-17T03:24:00'),
    list: [1, 1, 2, 3, 5, 8, 13],
    linkedBanana: realm.objectForPrimaryKey('Banana', banana1id),
    ListDecimal128: [
      Decimal128.fromString('1'),
      Decimal128.fromString('1'),
      Decimal128.fromString('2'),
    ],
    SetString: ['Vingegaard', 'Pogacar'],
    linkingObjects: realm.objectForPrimaryKey('AllTypes', uuid),
    dictionary: {
      windows: 5,
      doors: 3,
      color: 'red',
      address: 'Summerhill St.',
      price: 400123,
    },
    set: [1, 2, 3, 4],
    // mixed: realm.objectForPrimaryKey('AllTypes', uuid),
    uuid: new UUID(),
  };

  realm.write(() => {
    realm.create('AllTypes', AllTypes3);
  });

  let NoPrimaryKey1 = {
    _id: 789,
    name: 'CocaCola',
  };

  let NoPrimaryKey2 = {
    _id: 345,
    name: 'Fanta',
  };

  let NoPrimaryKey3 = {
    _id: 25234,
    name: 'Sprite',
  };

  realm.objects('Banana').filter;

  realm.write(() => {
    realm.create('NoPrimaryKey', NoPrimaryKey1);
    realm.create('NoPrimaryKey', NoPrimaryKey2);
    realm.create('NoPrimaryKey', NoPrimaryKey3);
  });

  let AllTypes4 = {
    _id: new UUID(),
    bool: true,
    int: 2453,
    float: 6.51415,
    double: 34.13215,
    string: 'string',
    decimal128: Decimal128.fromString('0.000000000000000000008901234567890'),
    objectId: ObjectId.createFromHexString('507f191e810c19729de860ea'),
    data: new ArrayBuffer(6),
    date: new Date('2006-11-17T03:24:00'),
    list: [1, 1, 2, 3, 5, 8, 13],
    linkedBanana: realm.objectForPrimaryKey('Banana', banana1id),
    ListDecimal128: [
      Decimal128.fromString('1'),
      Decimal128.fromString('1'),
      Decimal128.fromString('2'),
    ],
    SetString: ['Vingegaard', 'Pogacar'],
    linkingObjects: realm.objectForPrimaryKey('AllTypes', uuid2),
    dictionary: {
      windows: 5,
      doors: 3,
      color: 'red',
      address: 'Summerhill St.',
      price: 400123,
    },
    set: [1, 2, 3, 4],
    mixed: realm.objectForPrimaryKey('AllTypes', uuid2),
    listLinkedAlltypes: [
      realm.objectForPrimaryKey('AllTypes', uuid2),
      realm.objectForPrimaryKey('AllTypes', uuid3),
    ],
    uuid: new UUID(),
  };
  realm.write(() => {
    realm.create('AllTypes', AllTypes4);
  });
}
