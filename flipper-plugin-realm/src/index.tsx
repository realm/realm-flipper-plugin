import { createState, PluginClient, usePlugin, useValue } from 'flipper-plugin';

import React, { useState } from 'react';
import type Realm from 'realm';
import {
  AddLiveObjectRequest,
  DeleteLiveObjectRequest,
  EditLiveObjectRequest,
  Events,
  Methods,
  GetObjectsResponse,
  RealmPluginState,
  PlainRealmObject,
  GetRealmsResponse,
  GetSchemasResponse,
  DeserializedRealmObject,
  SortedObjectSchema,
  SerializedRealmObject,
} from './CommonTypes';
import { CommonHeader } from './components/common/CommonHeader';
import { DataVisualizerWrapper } from './components/DataVisualizerWrapper';
import { addToHistory } from './components/Query';
import SchemaSelect from './components/SchemaSelect';
import { SchemaGraph } from './pages/SchemaGraph';
import SchemaVisualizer from './pages/SchemaVisualizer';
import { deserializeRealmObject, deserializeRealmObjects } from './utils/ConvertFunctions';

// Read more: https://fbflipper.com/docs/tutorial/js-custom#creating-a-first-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#pluginclient
export function plugin(client: PluginClient<Events, Methods>) {
  const pluginState = createState<RealmPluginState>({
    deviceSerial: '',
    realms: [],
    selectedRealm: '',
    objects: [],
    schemas: [],
    schemaHistory: [],
    schemaHistoryIndex: 0,
    cursor: null,
    totalObjects: 0,
    sortingColumn: null,
    sortingDirection: null,
    hasMore: false,
    currentSchema: null,
    loading: false,
    query: '',
  });

  client.onMessage('getCurrentQuery', () => {
    const state = pluginState.get();
    client.send('receivedCurrentQuery', {
      schemaName: state.currentSchema ? state.currentSchema.name : null,
      realm: state.selectedRealm,
      sortingColumn: state.sortingColumn,
      sortingDirection: state.sortingDirection,
    });
  });

  const sortSchemaProperties = (schema: Realm.CanonicalObjectSchema) => {
    const sortedPropKeys = Object.keys(schema.properties).sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    const primKeyIndex = sortedPropKeys.findIndex(
      (key) => schema.primaryKey === key,
    );
    if (primKeyIndex >= 0) {
      const primKey = sortedPropKeys[primKeyIndex];
      sortedPropKeys.splice(primKeyIndex, 1);
      sortedPropKeys.splice(0, 0, primKey);
    }

    const newSchemaObj: SortedObjectSchema = {
      ...schema,
      order: sortedPropKeys,
    };

    Object.defineProperty(newSchemaObj, 'order', {
      enumerable: false,
      writable: true,
    });

    return newSchemaObj;
  };

  client.onMessage('liveObjectAdded', (data: AddLiveObjectRequest) => {
    const state = pluginState.get();
    const { index, schemaName, newObject } = data;
    if (schemaName !== state.currentSchema?.name) {
      return;
    }
 
    // Object already inserted
    if (index < state.objects.length && state.objects[index].objectKey == newObject.objectKey) {
      return;
    }
    const clone = structuredClone(newObject);
    const copyOfObjects = state.objects;
    const addedObject = deserializeRealmObject(
      clone,
      state.currentSchema,
    );
    copyOfObjects.splice(index, 0, addedObject);
    const newLastObject = copyOfObjects[copyOfObjects.length - 1];
    pluginState.set({
      ...state,
      objects: [...copyOfObjects],
      totalObjects: state.totalObjects + 1,
      cursor: newLastObject.objectKey,
    });
  });

  client.onMessage('liveObjectDeleted', (data: DeleteLiveObjectRequest) => {
    const state = pluginState.get();
    const { index, schemaName } = data;
    if (schemaName !== state.currentSchema?.name) {
      return;
    }

    // Object already deleted.
    if (index > state.objects.length) {
      return;
    }
    state.objects.splice(index, 1);
    const newLastObject = state.objects[state.objects.length - 1];
    pluginState.set({
      ...state,
      objects: state.objects,
      totalObjects: state.totalObjects - 1,
      cursor: newLastObject ? newLastObject.objectKey : null,
    });
  });

  client.onMessage('liveObjectEdited', (data: EditLiveObjectRequest) => {
    const state = pluginState.get();
    const { index, schemaName, newObject } = data;
    if (schemaName !== state.currentSchema?.name) {
      return;
    }
    if (index > state.objects.length) {
      return;
    }
    // Edited object not at index.
    if (state.objects[index].objectKey != data.newObject.objectKey) {
      return;
    }
    const clone = structuredClone(newObject);
    const copyOfObjects = state.objects;
    const addedObject = deserializeRealmObject(
      clone,
      state.currentSchema,
    );
    copyOfObjects.splice(index, 1, addedObject);
    const newLastObject = copyOfObjects[copyOfObjects.length - 1];
    pluginState.set({
      ...state,
      objects: [...copyOfObjects],
      cursor: newLastObject.objectKey,
    });
  });

  client.addMenuEntry({
    action: 'clear',
    handler: async () => {
      // pluginState.set({});
    },
  });

  const getRealms = () => {
    client.send('getRealms', undefined).then((realms: GetRealmsResponse) => {
      const state = pluginState.get();
      pluginState.set({
        ...state,
        realms: realms.realms,
        selectedRealm: realms.realms[0],
      });
      getSchemas(realms.realms[0]);
    });
  };

  const requestObjects = (
    schemaName?: string | null,
    realm?: string | null,
    toRestore?: Realm.Object[],
    cursor?: string | null,
    query?: string,
  ): Promise<GetObjectsResponse> => {
    const state = pluginState.get();
    if (!state.currentSchema) {
      return Promise.reject();
    }
    return client.send('getObjects', {
      schemaName: schemaName ?? state.currentSchema?.name,
      realm: realm ?? state.selectedRealm,
      cursor: cursor === undefined ? null : cursor,
      sortingColumn: state.sortingColumn,
      sortingDirection: state.sortingDirection ? state.sortingDirection : null,
      query: query ? query : state.query,
    });
  };

  const getObject = (
    realm: string,
    schemaName: string,
    objectKey: string,
  ) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      loading: true,
    });
    return client.send('getObject', {
      realm,
      schemaName,
      objectKey,
    }).then(
        (serializedObject: SerializedRealmObject) => {
          const actualSchema = state.schemas.find((schema) => schema.name === schemaName);
          if (!actualSchema) {
            return null;
          }
          const deserializedObject = deserializeRealmObject(serializedObject, actualSchema);
          return deserializedObject;
        },
        (reason) => {
          pluginState.set({
            ...state,
            errorMessage: reason.message,
          });
          return null;
        },
      )
      .catch((error) => {
        pluginState.set({
          ...state,
          errorMessage: error.message,
        });
        return null;
      });
  };

  const getObjects = (
    schemaName?: string | null,
    realm?: string | null,
    toRestore?: Realm.Object[],
    cursor?: string | null,
  ) => {
    const state = pluginState.get();
    if (!state.currentSchema || state.currentSchema.embedded) {
      return;
    }
    schemaName = schemaName ?? state.currentSchema.name;
    realm = realm ?? state.selectedRealm;
    cursor = cursor ?? state.cursor;
    pluginState.set({
      ...state,
      loading: true,
    });
    requestObjects(schemaName, realm, toRestore, cursor)
      .then(
        (response: GetObjectsResponse) => {
          if (response.objects && !response.objects.length) {
            pluginState.set({
              ...state,
              hasMore: false,
              loading: false,
              totalObjects: response.total,
              cursor: null,
            });
            return;
          }

          const nextCursor = response.nextCursor;

          if (!state.currentSchema || state.currentSchema?.name !== schemaName) {
            return;
          }
          const objects = deserializeRealmObjects(
            response.objects,
            state.currentSchema,
          );
          pluginState.set({
            ...state,
            objects: [...state.objects, ...objects],
            cursor: nextCursor,
            totalObjects: response.total,
            hasMore: response.hasMore,
            errorMessage: '',
            loading: false,
          });
        },
        (reason) => {
          pluginState.set({
            ...state,
            errorMessage: reason.message,
            objects: [],
            loading: false,
          });
        },
      )
      .catch((error) => {
        pluginState.set({
          ...state,
          errorMessage: error.message,
          objects: [],
          loading: false,
        });
      });
  };
  const downloadData = (
    schemaName: string,
    objectKey: string,
    propertyName: string,
  ) => {
    const state = pluginState.get();
    return client.send('downloadData', {
      schemaName,
      realm: state.selectedRealm,
      objectKey,
      propertyName,
    });
  };

  const getSchemas = (realm: string) => {
    client
      .send('getSchemas', { realm: realm })
      .then((schemaResult: GetSchemasResponse) => {
        const newSchemas = schemaResult.schemas.map((schema) =>
          sortSchemaProperties(schema),
        );
        const state = pluginState.get();
        pluginState.set({
          ...state,
          schemas: newSchemas,
        });
        if (newSchemas.length) {
          setSelectedSchema(newSchemas[0]);
          getObjects(newSchemas[0].name, state.selectedRealm);
        }
      });
  };

  const executeQuery = async (query: string) => {
    const state = pluginState.get();
    addToHistory(query);
    // clear pagination...
    pluginState.set({
      ...state,
      cursor: null,
      sortingColumn: null,
      query: query,
      objects: [],
    });
    getObjects();
  };

  const addObject = (object: PlainRealmObject) => {
    const state = pluginState.get();
    if (!state.currentSchema) {
      return;
    }
    client
      .send('addObject', {
        realm: state.selectedRealm,
        schemaName: state.currentSchema?.name,
        object,
      })
      .catch((reason) => {
        pluginState.set({ ...state, errorMessage: reason.error });
      });
  };

  const setSelectedSchema = (schema: SortedObjectSchema) => {
    const state = pluginState.get();

    // target schema is already selected
    if (state.currentSchema?.name === schema.name) {
      return;
    }

    const newHistory = Array.from(state.schemaHistory);
    const index = state.schemaHistoryIndex;

    newHistory.splice(index + 1);
    newHistory.push(schema);

    const length = newHistory.length - 1;

    pluginState.set({
      ...state,
      schemaHistory: [...newHistory],
      schemaHistoryIndex: length,
      cursor: null,
      objects: [],
      sortingColumn: null,
      currentSchema: schema,
      query: '',
      errorMessage: '',
    });
  };

  const goBackSchemaHistory = (schema: SortedObjectSchema) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      schemaHistoryIndex: state.schemaHistoryIndex - 1,
      cursor: null,
      objects: [],
      sortingColumn: null,
      currentSchema: schema,
    });
  };

  const goForwardSchemaHistory = (schema: SortedObjectSchema) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      schemaHistoryIndex: state.schemaHistoryIndex + 1,
      cursor: null,
      objects: [],
      sortingColumn: null,
      currentSchema: schema,
    });
  };

  const setSelectedRealm = (realm: string) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedRealm: realm,
      objects: [],
      cursor: null,
    });
  };

  client.onConnect(() => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      deviceSerial: client.device.serial,
    });
    getRealms();
  });

  const modifyObject = (
    newObject: DeserializedRealmObject,
    propsChanged: Set<string>,
  ) => {
    if(newObject.realmObject == undefined) {
      return;
    }
    const state = pluginState.get();
    client
      .send('modifyObject', {
        realm: state.selectedRealm,
        schemaName: state.currentSchema?.name,
        object: newObject.realmObject,
        objectKey: newObject.objectKey,
        propsChanged: Array.from(propsChanged.values()),
      })
      .catch((e: Error) => {
        pluginState.set({
          ...state,
          errorMessage: e.message,
        });
      });
  };

  const removeObject = (removedObject: DeserializedRealmObject) => {
    if(removedObject.realmObject == undefined) {
      return;
    }
    const state = pluginState.get();
    const schema = state.currentSchema;
    if (!schema) {
      return;
    }
    client.send('removeObject', {
      realm: state.selectedRealm,
      schemaName: schema.name,
      object: removedObject.realmObject,
      objectKey: removedObject.objectKey,
    });
  };

  const setSortingColumn = (sortingColumn: string | null) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      objects: [],
      sortingColumn: sortingColumn,
      cursor: null,
    });
  };

  const toggleSortingDirection = () => {
    let state = pluginState.get();
    let newSortingDirection: 'ascend' | 'descend' | null = null;
    if (state.sortingDirection === null) {
      newSortingDirection = 'ascend';
    } else if (state.sortingDirection === 'ascend') {
      newSortingDirection = 'descend';
    } else {
      newSortingDirection = null;
      setSortingColumn(null);
    }
    state = pluginState.get();
    pluginState.set({
      ...state,
      sortingDirection: newSortingDirection,
      cursor: null,
      objects: [],
    });
  };

  const setSortingDirection = (direction: 'ascend' | 'descend' | null) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      sortingDirection: direction,
    });
  };

  const refreshState = () => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      cursor: null,
      sortingColumn: null,
      sortingDirection: null,
      loading: false,
      query: '',
      errorMessage: '',
      objects: [],
    });
    getObjects();
  };

  const clearError = () => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      errorMessage: undefined,
    });
  };

  return {
    state: pluginState,
    getObject,
    getObjects,
    getSchemas,
    executeQuery,
    addObject,
    setSelectedSchema,
    setSelectedRealm,
    modifyObject,
    removeObject,
    goBackSchemaHistory,
    goForwardSchemaHistory,
    setSortingColumn,
    toggleSortingDirection,
    setSortingDirection,
    refreshState,
    clearError,
    requestObjects,
    downloadData,
  };
}

export function Component() {
  const { state, getObjects } = usePlugin(plugin);
  const {
    realms,
    objects,
    schemas,
    sortingDirection,
    sortingColumn,
    currentSchema,
    hasMore,
    selectedRealm,
    totalObjects,
  } = useValue(state);

  const [viewMode, setViewMode] = useState<'data' | 'schemas' | 'schemaGraph'>(
    'data',
  );

  return (
    <>
      <CommonHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        realms={realms}
      />
      {viewMode === 'data' && currentSchema ? (
        <DataVisualizerWrapper
          schemas={schemas}
          objects={objects}
          hasMore={hasMore}
          currentSchema={currentSchema}
          sortingDirection={sortingDirection}
          sortingColumn={sortingColumn}
          totalObjects={totalObjects}
          fetchMore={getObjects}
        />
      ) : null}
      {viewMode === 'schemas' ? (
        <>
          <SchemaSelect schemas={schemas} />
          <SchemaVisualizer schemas={schemas} currentSchema={currentSchema} />
        </>
      ) : null}
      {/* {viewMode === 'RQL' ? <></> : null} */}
      {viewMode === 'schemaGraph' ? (
        <SchemaGraph schemas={schemas} selectedRealm={selectedRealm} />
      ) : null}
    </>
  );
}
