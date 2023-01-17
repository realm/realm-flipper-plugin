export type PlainRealmObject = Record<string, unknown>

/**
 * An interface containing refereence information about a Realm object sent
 * from the device plugin.
 */
export interface RealmObjectReference {
  // The object key of the stored Realm object
  objectKey: string;
  objectType: string; 
}

/** 
 * An interface for receiving and sending Realm Objects between
 * the desktop plugin and the device.
 * @see DeserializedRealmObject
**/
export interface SerializedRealmObject extends RealmObjectReference {
  // Result of serializaing a Realm object from flatted.toJSON(realmObject.toJSON())
  realmObject: never;
}

/** 
 * A helper interface which wraps Realm.Object with
 * information about its object type and key for reference.
 * @see SerializedRealmObject
**/
export interface DeserializedRealmObject extends RealmObjectReference {
  // A plain representation of the Realm object
  realmObject: PlainRealmObject;
}

/**  A Realm.CanonicalObjectSchema interface with a sorting order field. */
export interface SortedObjectSchema extends Realm.CanonicalObjectSchema {
  order: string[];
}

export interface CanonicalObjectSchemaPropertyRow
  extends Realm.CanonicalObjectSchemaProperty {
  key: number;
  primaryKey: boolean;
}

export interface DeserializedRealmData {
  length: number;
  info: [string, string, string];
}

export interface DeserializedRealmDecimal128 { 
  $numberDecimal: string
}

export type DownloadDataFunction = (schema: string, objectKey: string, propertyName: string) => Promise<Uint8Array>;

export type RealmPluginState = {
  deviceSerial: string;
  realms: string[];
  selectedRealm: string;
  objects: DeserializedRealmObject[];
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
  getObjects: GetObjectsResponse;
  getSchemas: GetSchemasResponse;
  liveObjectAdded: AddLiveObjectRequest;
  liveObjectDeleted: DeleteLiveObjectRequest;
  liveObjectEdited: EditLiveObjectRequest;
  getCurrentQuery: undefined;
  getRealms: GetRealmResponse;
  executeQuery: QueryResult;
};
export type Methods = {
  executeQuery: (query: QueryObject) => Promise<Realm.Object[]>;
  getObjects: (data: GetObjectsRequest) => Promise<GetObjectsResponse>;
  getObject: (data: GetObjectRequest) => Promise<SerializedRealmObject>;
  getSchemas: (data: GetSchemasRequest) => Promise<GetSchemasResponse>;
  getRealms: () => Promise<GetRealmResponse>;
  addObject: (object: AddObjectsRequest) => Promise<PlainRealmObject>;
  modifyObject: (newObject: EditObject) => Promise<PlainRealmObject>;
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
  object: PlainRealmObject;
  propsChanged?: string[];
  objectKey: string;
};

export type RemoveObject = {
  schemaName?: string;
  realm?: string;
  object: PlainRealmObject;
  objectKey: string;
};

export type AddObjectsRequest = {
  schemaName?: string;
  realm?: string;
  object: PlainRealmObject;
  propsChanged?: string[];
};
export type GetRealmResponse = {
  realms: string[];
  objects: Record<string, unknown>[];
  total: number;
};

export type ObjectMessage = {
  object: Realm.Object;
};

type GetSchemasRequest = {
  realm: string;
};

export type GetSchemasResponse = {
  schemas: Array<Realm.CanonicalObjectSchema>;
};

type GetObjectRequest = {
  schema: string;
  realm: string;
  objectKey: string;
};

export type GetObjectsRequest = {
  schemaName: string;
  realm: string;
  cursor: string | null;
  sortingColumn: string | null;
  sortingDirection: 'ascend' | 'descend' | null;
  query: string;
};

export type GetObjectsResponse = {
  objects: SerializedRealmObject[];
  total: number;
  nextCursor: string;
  prev_cursor: { [sortingField: string]: number };
  hasMore: boolean;
};

export type ObjectRequest = {
  schemaName: string;
  realm: string;
  primaryKey: string;
};
export type AddLiveObjectRequest = {
  newObject: SerializedRealmObject;
  index: number;
  schemaName: string;
  newObjectKey: string;
};
export type DeleteLiveObjectRequest = {
  index: number;
  schemaName: string;
};
export type EditLiveObjectRequest = {
  newObject: SerializedRealmObject;
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


export type MenuItem = {
  key: number;
  text: string;
  onClick: () => void;
};

export type MenuItemGenerator = (
  row: DeserializedRealmObject,
  schemaProperty: Realm.CanonicalObjectSchemaProperty,
  schema: Realm.ObjectSchema,
) => Array<MenuItem>;

export type DropdownPropertyType = {
  record: DeserializedRealmObject | null;
  schemaProperty: Realm.CanonicalObjectSchemaProperty | null;
  currentSchema: Realm.ObjectSchema;
  visible: boolean;
  pointerX: number;
  pointerY: number;
  scrollX: number;
  scrollY: number;
  generateMenuItems: MenuItemGenerator;
};
