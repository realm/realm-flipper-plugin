import { Decimal128, ObjectId, UUID } from "bson";

export type RealmPluginState = {
  realms: string[];
  selectedRealm: string;
  objects: RealmObject[];
  schemas: SchemaObject[];
  currentSchema: SchemaObject | null;
  errorMsg?: string;
  schemaHistory: SchemaObject[];
  schemaHistoryIndex: number;
  cursorId: number | null;
  filterCursor: number | null;
  selectedPageSize: 10 | 25 | 50 | 75 | 100 | 1000 | 2500;
  currentPage: number;
  totalObjects: number;
  sortingColumn: string | null;
  sortDirection: 'ascend' | 'descend' | null;
  prev_page_cursorId: number | null;
  hasMore: boolean;
  prev_page_filterCursor: number | null;
  sortingColumnType: string | null;
};
const typeList = [
  'objectId',
  'uuid',
  'bool',
  'int',
  'float',
  'double',
  'decimal128',
  'string',
  'data',
  'date',
];
// export type RealmPrimitiveValue = ObjectId | UUID | boolean | number | Decimal128 | string | Date | ArrayBuffer
// export type RealmValueType = RealmObject | RealmPrimitiveValue | Array<RealmValueType> |  
export type RealmObject = Record<string, unknown>;

export type SchemaObject = {
  name: string;
  embedded: boolean;
  asymmetric: boolean;
  primaryKey: string;
  properties: { [key: string]: SchemaProperty };
  order: Array<string>;
};

export type SchemaProperty = {
  name: string;
  indexed: boolean;
  optional: boolean;
  type: string;
  mapTo: string;
  objectType?: string;
};
export type Events = {
  getObjects: ObjectsMessage;
  getSchemas: SchemaMessage;
  liveObjectAdded: AddLiveObjectRequest;
  liveObjectDeleted: DeleteLiveObjectRequest;
  liveObjectEdited: EditLiveObjectRequest;
  getRealms: RealmsMessage;
  executeQuery: QueryResult;
  getOneObject: ObjectMessage;
};
export type Methods = {
  executeQuery: (query: QueryObject) => Promise<RealmObject[]>;
  getObjects: (data: getForwardsObjectsRequest) => Promise<RealmObject[]>;
  getSchemas: (data: RealmRequest) => Promise<SchemaObject[]>;
  getRealms: () => Promise<string[]>;
  addObject: (object: AddObject) => Promise<RealmObject>;
  modifyObject: (newObject: AddObject) => Promise<RealmObject>;
  removeObject: (object: AddObject) => Promise<void>;
  getOneObject: (data: ObjectRequest) => Promise<RealmObject>;
};

export type AddObject = {
  schema?: string;
  realm?: string;
  object: RealmObject;
};
export type RealmsMessage = {
  realms: string[];
};
export type ObjectsMessage = {
  objects: Array<RealmObject>;
  total: number;
  next_cursor: { [sortingField: string]: number };
  prev_cursor: { [sortingField: string]: number };
  hasMore: boolean;
};
export type ObjectMessage = {
  object: RealmObject;
};
export type SchemaMessage = {
  schemas: Array<SchemaObject>;
};
type RealmRequest = {
  realm: string;
};
type getForwardsObjectsRequest = {
  schema: string;
  realm: string;
  filterCursor: string | number | null;
  cursorId: number | null;
  limit: number;
  sortingColumn: string | null;
  sortingColumnType: string | null;
  sortDirection: 'ascend' | 'descend' | null;
  prev_page_filterCursor: string | number | null;
  prev_page_cursorId: number | null;
  backwards: boolean;
};

export type ObjectRequest = {
  schema: string;
  realm: string;
  primaryKey: string;
};
export type AddLiveObjectRequest = {
  newObject: RealmObject;
};
export type DeleteLiveObjectRequest = {
  index: number;
};
export type EditLiveObjectRequest = {
  newObject: RealmObject;
  index: number;
};
type QueryObject = {
  schema: string;
  query: string;
  realm: string;
};
export type QueryResult = {
  result: Array<RealmObject> | string;
};
