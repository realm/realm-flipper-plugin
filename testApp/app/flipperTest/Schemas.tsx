import {createRealmContext} from '@realm/react';

export const InfoSchema = {
  name: 'Info',
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
    task: 'Info?',
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

export const NestedObjectSchema: Realm.ObjectSchema = {
  name: 'NestedObject',
  properties: {
    cornerCase: 'CornerCase?',
    nestedObject: 'NestedObject?',
  },
};

export const EmbeddedSchema: Realm.ObjectSchema = {
  name: 'EmbeddedObject',
  embedded: true,
  properties: {
    items: 'string[]',
    // Not currently supported.
    // directCycle: 'EmbeddedObject?',
    indirectCycle: 'CornerCase?',
  },
};

export const CornerCaseSchema: Realm.ObjectSchema = {
  name: 'CornerCase',
  properties: {
    mixed: 'mixed?',
    embedded: 'EmbeddedObject?',
    directCycle: 'CornerCase?',
    indirectCycle: 'NestedObject?',
  },
};

export const FlipperTestRealmContext = createRealmContext({
  schema: [
    InfoSchema,
    BananaSchema,
    MaybeSchema,
    AllTypesSchema,
    NoPrimaryKey,
    DictSchema,
    SetsSchema,
    DataSchema,
    NoPrimaryKeyLink,
    NestedObjectSchema,
    CornerCaseSchema,
    EmbeddedSchema,
  ],
  path: 'flipper_test',
});

export const FlipperTestSecondRealmContext = createRealmContext({
  schema: [Parcel, ParcelService, Delivery, MailCarrier],
  path: 'flipper_test_2',
});
