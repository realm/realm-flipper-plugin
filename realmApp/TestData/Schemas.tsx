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
    ListDecimal128: 'decimal128[]',
    SetDecimal128: 'decimal128<>',
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
