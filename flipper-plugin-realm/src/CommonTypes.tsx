import { AddLiveObjectRequest, AddObjectRequest, DownloadDataRequest, DeleteLiveObjectRequest, EditLiveObjectRequest, ModifyObjectRequest, GetObjectRequest, GetObjectsRequest, GetObjectsResponse, GetRealmsResponse, GetSchemasRequest, GetSchemasResponse, PlainRealmObject, ReceivedCurrentQueryRequest, RemoveObjectRequest, SerializedRealmObject, RealmObjectReference} from "./SharedTypes";


/** 
 * A helper interface which wraps Realm.Object with
 * information about its object type and key for reference.
 * @see SerializedRealmObject
**/
export interface DeserializedRealmObject extends RealmObjectReference {
  // A plain representation of the Realm object
  realmObject: PlainRealmObject;
}

export interface DeserializedRealmData {
  length: number;
  info: [string, string, string];
}

export interface DeserializedRealmDecimal128 { 
  $numberDecimal: string
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
  getRealms: GetRealmsResponse;
  executeQuery: QueryResult;
};

export type Methods = {
  executeQuery: (query: QueryObject) => Promise<Realm.Object[]>;
  getObjects: (data: GetObjectsRequest) => Promise<GetObjectsResponse>;
  getObject: (data: GetObjectRequest) => Promise<SerializedRealmObject>;
  getSchemas: (data: GetSchemasRequest) => Promise<GetSchemasResponse>;
  getRealms: () => Promise<GetRealmsResponse>;
  addObject: (object: AddObjectRequest) => Promise<PlainRealmObject>;
  modifyObject: (newObject: ModifyObjectRequest) => Promise<PlainRealmObject>;
  removeObject: (object: RemoveObjectRequest) => Promise<void>;
  receivedCurrentQuery: (request: ReceivedCurrentQueryRequest) => Promise<void>;
  downloadData: (data: DownloadDataRequest) => Promise<Uint8Array>;
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
export { AddLiveObjectRequest, AddObjectRequest, DownloadDataRequest, DeleteLiveObjectRequest, EditLiveObjectRequest, ModifyObjectRequest, GetObjectRequest, GetObjectsRequest, GetObjectsResponse, GetRealmsResponse, GetSchemasRequest, GetSchemasResponse, PlainRealmObject, ReceivedCurrentQueryRequest, RemoveObjectRequest, SerializedRealmObject, RealmObjectReference };

