export const Person = {
  name: 'Person',
  properties: {
    _id: 'int',
    bestFriend: 'Person?',
    hobbies: 'string[]',
    favouriteThing: 'mixed',
  },
  primaryKey: '_id',
};

export const TaskSchema = {
  name: 'Task',
  properties: {
    _id: 'int',
    name: 'string',
    status: 'string?',
  },
  primaryKey: '_id',
};

export const BananaSchema = {
  name: 'Banana',
  properties: {
    _id: 'int',
    name: 'string',
    color: 'string',
    length: 'int',
    weight: 'int',
    task: 'Task?',
  },
  primaryKey: '_id',
};

export const AllTypesSchema = {
  name: 'AllTypes',
  properties: {
    _id: 'uuid',
    bool: 'bool',
    int: 'int',
    float: 'float',
    double: 'double',
    string: 'string?',
    decimal128: 'decimal128',
    objectId: 'objectId?',
    data: 'data',
    date: 'date',
    list: 'int[]',
    linkedBanana: 'Banana?',
    linkingObjects: 'AllTypes?',
    listLinkedAlltypes: 'AllTypes[]',
    ListDecimal128: 'decimal128[]',
    // SetDecimal128: 'decimal128<>',
    ObjectList: 'mixed[]',
    ObjectSet: 'mixed<>',
    dictionary: '{}',
    set: 'int<>',
    mixed: 'mixed',
    uuid: 'uuid',
  },
  primaryKey: '_id',
};

export const MaybeSchema = {
  name: 'Maybe',
  properties: {
    _id: 'int',
    bool: 'bool?',
    int: 'int?',
    float: 'float?',
    double: 'double?',
    decimal128: 'decimal128?',
    objectId: 'objectId?',
    data: 'data?',
    date: 'date?',
    linkedBanana: 'Banana?',
    linkingObjects: 'AllTypes?',
    mixed: 'mixed?',
    uuid: 'uuid?',
    string: 'string?',
    dictionary: '{}',
  },
  primaryKey: '_id',
};

export const DictSchema = {
  name: 'Dict',
  properties: {
    _id: 'uuid',
    dict: '{}',
    AllTypess: 'AllTypes[]',
  },
  primaryKey: '_id',
};

export const NoPrimaryKey = {
  name: 'NoPrimaryKey',
  properties: {
    _id: 'int',
    name: 'string?',
  },
};

export const SetsSchema = {
  name: 'Sets',
  properties: {
    _id: 'uuid',
    intSet: 'int<>',
    setsSet: 'Sets<>',
    mixedSet: 'mixed<>',
    objectSet: 'AllTypes<>',
  },
  primaryKey: '_id',
};

export const MailCarrier = {
  name: 'MailCarrier',
  properties: {
    _id: 'uuid',
    name: 'string',
    city: 'string',
    zipCode: 'string',
    street: 'string',
    houseNumber: 'string',
    phoneNumber: 'string',
  },
  primaryKey: '_id',
};

export const ParcelService = {
  name: 'ParcelService',
  properties: {
    _id: 'uuid',
    name: 'string',
    city: 'string',
    zipCode: 'string',
    street: 'string',
    houseNumber: 'string',
    mailCarrier: 'MailCarrier',
  },
  primaryKey: '_id',
};

export const Parcel = {
  name: 'Parcel',
  properties: {
    _id: 'uuid',
    length: 'int',
    width: 'int',
    height: 'int',
    weight: 'int',
  },
  primaryKey: '_id',
};

export const Delivery = {
  name: 'Delivery',
  properties: {
    _id: 'uuid',
    receiver: 'string',
    city: 'string',
    zipCode: 'string',
    street: 'string',
    houseNumber: 'string',
    parcel: 'Parcel',
    parcelService: 'ParcelService',
  },
  primaryKey: '_id',
};

export const OptionalContainers = {
  name: 'OptionalContainers',
  properties: {
    list: 'int?[]',
    listt: {
      type: 'list',
      objectType: 'int',
      optional: true,
    },
    _id: 'uuid',
  },
  primaryKey: '_id',
};

export const DataSchema = {
  name: 'DataSchema',
  properties: {
    _id: 'uuid',
    keyName: 'data',
  },
  primaryKey: '_id',
};

export const NoPrimaryKeyLink = {
  name: 'NoPrimaryKeyLink',
  properties: {
    link: 'NoPrimaryKey',
    dict: {
      type: 'dictionary',
      objectType: 'uuid',
    },
    dataList: {
      type: 'list',
      objectType: 'data',
    },
  },
};
