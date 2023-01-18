// A helper interface which extends Realm.Object with
// a string index signature and object key field for reference.
export interface IndexableRealmObject extends Realm.Object {
  [key: string]: unknown;
  // Contains the object key that was sent by the device.
  _pluginObjectKey: string;
}

// A Realm.CanonicalObjectSchema interface with a sorting order field.
export interface SortedObjectSchema extends Realm.CanonicalObjectSchema {
  order: string[];
}

export interface CanonicalObjectSchemaPropertyRow
  extends Realm.CanonicalObjectSchemaProperty {
  key: number;
  primaryKey: boolean;
}

export type RealmPluginState = {
  deviceSerial: string;
  realms: string[];
  selectedRealm: string;
  objects: IndexableRealmObject[];
  schemas: SortedObjectSchema[];
  currentSchema: SortedObjectSchema | null;
  schemaHistory: SortedObjectSchema[];
  schemaHistoryIndex: number;
  cursor: string | null;
  totalObjects: number;
  sortingColumn: string | null;
  sortingDirection: 'ascend' | 'descend' | null;
  hasMore: boolean;
  loading: boolean;
  query: string;
  errorMessage?: string;
};

export type Events = {
  getObjects: ObjectsMessage;
  getSchemas: SchemaMessage;
  liveObjectAdded: AddLiveObjectRequest;
  liveObjectDeleted: DeleteLiveObjectRequest;
  liveObjectEdited: EditLiveObjectRequest;
  getCurrentQuery: undefined;
  getRealms: RealmsMessage;
  executeQuery: QueryResult;
};
export type Methods = {
  executeQuery: (query: QueryObject) => Promise<Realm.Object[]>;
  getObjects: (data: getForwardsObjectsRequest) => Promise<ObjectsMessage>;
  getSchemas: (data: RealmRequest) => Promise<SchemaMessage>;
  getRealms: () => Promise<RealmsMessage>;
  addObject: (object: AddObject) => Promise<Realm.Object>;
  modifyObject: (newObject: EditObject) => Promise<Realm.Object>;
  removeObject: (object: RemoveObject) => Promise<void>;
  receivedCurrentQuery: (request: ReceivedCurrentQueryRequest) => Promise<void>;
  downloadData: (data: DataDownloadRequest) => Promise<Uint8Array>;
};

type ReceivedCurrentQueryRequest =  {
  schemaName: string | null;
  realm: string;
  sortingDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
}

type DataDownloadRequest = {
  schemaName: string;
  realm: string;
  objectKey: string;
  propertyName: string;
};

export type EditObject = {
  schemaName?: string;
  realm?: string;
  object: Realm.Object;
  propsChanged?: string[];
  objectKey: string;
};

export type RemoveObject = {
  schemaName?: string;
  realm?: string;
  object: Realm.Object;
  objectKey: string;
};

export type AddObject = {
  schemaName?: string;
  realm?: string;
  object: Realm.Object;
  propsChanged?: string[];
};
export type RealmsMessage = {
  realms: string[];
  objects: Record<string, unknown>[];
  total: number;
};
export type ObjectsMessage = {
  objects: IndexableRealmObject[];
  total: number;
  nextCursor: string;
  prev_cursor: { [sortingField: string]: number };
  hasMore: boolean;
};
export type ObjectMessage = {
  object: Realm.Object;
};
export type SchemaMessage = {
  schemas: Array<Realm.CanonicalObjectSchema>;
};
type RealmRequest = {
  realm: string;
};
type getForwardsObjectsRequest = {
  schemaName: string;
  realm: string;
  cursor: string | null;
  sortingColumn: string | null;
  sortingDirection: 'ascend' | 'descend' | null;
  query: string;
};

export type ObjectRequest = {
  schemaName: string;
  realm: string;
  primaryKey: string;
};
export type AddLiveObjectRequest = {
  newObject: IndexableRealmObject;
  index: number;
  schemaName: string;
  newObjectKey: string;
};
export type DeleteLiveObjectRequest = {
  index: number;
  schemaName: string;
};
export type EditLiveObjectRequest = {
  newObject: IndexableRealmObject;
  index: number;
  schemaName: string;
  newObjectKey: string;
};
type QueryObject = {
  schemaName: string;
  query: string;
  realm: string;
};
export type QueryResult = {
  result: Array<Realm.Object> | string;
};
