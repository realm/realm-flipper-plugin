const {UUID, Decimal128, ObjectId} = Realm.BSON;
import Realm from 'realm';

export function createAllTypesTestData(realm: Realm) {
  realm.write(() => {
    realm.delete(realm.objects('AllTypes'));
  });

  let uuid = new UUID('aa79b9ed-fbc0-4038-8f16-31f4da3efb9e');

  let AllTypes1 = {
    _id: uuid,
    bool: true,
    int: 888,
    float: 3.1415,
    double: 3.1415,
    string: 'string',
    decimal128: Decimal128.fromString('123456.123456789012345678901234567890'),
    //objectId: 'objectId',
    data: new ArrayBuffer(6),
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
    mixed: new Date('August 17, 2020'),
    uuid: new UUID(),
  };

  realm.write(() => {
    realm.create('AllTypes', AllTypes1);
  });

  let AllTypes2 = {
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
    linkingObjects: realm.objectForPrimaryKey('AllTypes', uuid),
    dictionary: {
      windows: 5,
      doors: 3,
      color: 'red',
      address: 'Summerhill St.',
      price: 400123,
    },
    set: [1, 2, 3, 4],
    mixed: realm.objectForPrimaryKey('AllTypes', uuid),
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

  let AllTypes3 = {
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
    SetDecimal128: [
      Decimal128.fromString('1'),
      Decimal128.fromString('1'),
      Decimal128.fromString('2'),
    ],
    // ObjectList: [
    //   {
    //     name: 'Jonas',
    //     surname: 'Vingegaard',
    //     age: 26,
    //     tourWins: [2022, 2023, 2024, 2025],
    //   },
    //   {
    //     name: 'Jonas',
    //     surname: 'Vingegaard',
    //     age: 26,
    //     tourWins: [2022, 2023, 2024, 2025],
    //   },
    //   {name: 'Tadej', surname: 'Pogacar', age: 27, tourWins: [2019, 2020]},
    // ],

    // ObjectSet: [
    //   {
    //     name: 'Jonas',
    //     surname: 'Vingegaard',
    //     age: 26,
    //     tourWins: [2022, 2023, 2024, 2025],
    //   },

    //   {name: 'Tadej', surname: 'Pogacar', age: 27, tourWins: [2019, 2020]},
    // ],
    linkingObjects: realm.objectForPrimaryKey('AllTypes', uuid),
    dictionary: {
      windows: 5,
      doors: 3,
      color: 'red',
      address: 'Summerhill St.',
      price: 400123,
    },
    set: [1, 2, 3, 4],
    mixed: realm.objectForPrimaryKey('AllTypes', uuid),
    uuid: new UUID(),
  };

  realm.write(() => {
    realm.create('AllTypes', AllTypes3);
  });
}
