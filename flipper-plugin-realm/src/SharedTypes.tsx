/** Types shared across the desktop plugin and the device library */
export type PlainRealmObject = Record<string, unknown>
/**
 * An interface containing refereence information about a Realm object sent
 * from the device plugin.
 */
export interface RealmObjectReference {
    // The object key of the stored Realm object
    objectKey: string;
    objectType?: string; 
  }
  
/** 
 * An interface for receiving and sending Realm Objects between
 * the desktop plugin and the device.
 * @see DeserializedRealmObject
 **/
export interface SerializedRealmObject extends RealmObjectReference {
    // Result of serializaing a Realm object from flatted.toJSON(realmObject.toJSON())
    realmObject: any;
}

export type ReceivedCurrentQueryRequest =  {
    schemaName: string | null;
    realm: string;
    sortingDirection: 'ascend' | 'descend' | null;
    sortingColumn: string | null;
}
  
export type DownloadDataRequest = {
    schemaName: string;
    realm: string;
    objectKey: string;
    propertyName: string;
};
  
export type ModifyObjectRequest = {
    schemaName?: string;
    realm?: string;
    object: PlainRealmObject;
    propsChanged?: string[];
    objectKey: string;
};
  
export type RemoveObjectRequest = {
    schemaName?: string;
    realm?: string;
    object: PlainRealmObject;
    objectKey: string;
};
  
export type AddObjectRequest = {
    schemaName?: string;
    realm?: string;
    object: PlainRealmObject;
    propsChanged?: string[];
};

export type GetRealmsResponse = {
    realms: string[];
    objects: Record<string, unknown>[];
    total: number;
};
  
export type ObjectMessage = {
    object: Realm.Object;
};
  
export type GetSchemasRequest = {
    realm: string;
};
  
export type GetSchemasResponse = {
    schemas: Array<Realm.CanonicalObjectSchema>;
};
  
export type GetObjectRequest = {
    schemaName: string;
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
