import { createState, PluginClient, usePlugin, useValue } from 'flipper-plugin';

import React, { useState } from 'react';
import {
  AddLiveObjectRequest,
  DeleteLiveObjectRequest,
  EditLiveObjectRequest,
  Events,
  Methods,
  ObjectMessage,
  ObjectsMessage,
  RealmObject,
  RealmPluginState,
  RealmsMessage,
  SchemaMessage,
  SchemaObject,
} from './CommonTypes';
import { CommonHeader } from './components/common/CommonHeader';
import { DataVisualizerWrapper } from './components/DataVisualizerWrapper';
import { addToHistory } from './components/Query';
import SchemaSelect from './components/SchemaSelect';
import { SchemaGraph } from './pages/SchemaGraph';
import SchemaVisualizer from './pages/SchemaVisualizer';
import { convertObjects } from './utils/ConvertFunctions';

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
  client.onMessage('getOneObject', (data: ObjectMessage) => {
    const state = pluginState.get();
    pluginState.set({ ...state, singleObject: data.object }); //TODO: remove this???
  });

  client.onMessage('getCurrentQuery', () => {
    const state = pluginState.get();
    client.send('receivedCurrentQuery', {
      schema: state.currentSchema ? state.currentSchema.name : null,
      realm: state.selectedRealm,
      sortingColumn: state.sortingColumn,
      sortingDirection: state.sortingDirection,
    });
  });

  const sortSchemaProperties = (schema: SchemaObject) => {
    const sortedPropKeys = Object.keys(schema.properties).sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    const primKeyIndex = sortedPropKeys.findIndex(
      (key) => schema.primaryKey === key
    );
    if (primKeyIndex >= 0) {
      const primKey = sortedPropKeys[primKeyIndex];
      sortedPropKeys.splice(primKeyIndex, 1);
      sortedPropKeys.splice(0, 0, primKey);
    }

    const newSchemaObj: SchemaObject = {
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
    console.log('Added', data);
    const state = pluginState.get();
    const { newObject, index, schema, newObjectKey } = data;
    if (schema != state.currentSchema?.name) {
      return;
    }
    if (index > state.objects.length) {
      return;
    }
    const clone = structuredClone(newObject);
    clone._objectKey = newObjectKey;
    const newObjects = state.objects;
    const addedObject = convertObjects(
      [clone],
      state.currentSchema,
      downloadData
    )[0]; //TODO: possibly switch clone and newObject here
    newObjects.splice(index, 0, addedObject);
    const newLastObject = newObjects[newObjects.length - 1];
    pluginState.set({
      ...state,
      objects: [...newObjects],
      totalObjects: state.totalObjects + 1,
      cursor: newLastObject._objectKey as string,
    });
  });

  client.onMessage('liveObjectDeleted', (data: DeleteLiveObjectRequest) => {
    console.log('DELETE', data);
    const state = pluginState.get();
    const { index, schema } = data;
    if (schema != state.currentSchema?.name) {
      return;
    }
    if (index > state.objects.length) {
      return;
    }
    const newObjects = state.objects;
    newObjects.splice(index, 1);
    const newLastObject = newObjects[newObjects.length - 1];
    pluginState.set({
      ...state,
      objects: [...newObjects],
      totalObjects: state.totalObjects - 1,
      cursor: newLastObject ? newLastObject._objectKey as string: null,
    });
  });

  client.onMessage('liveObjectEdited', (data: EditLiveObjectRequest) => {
    console.log('EDIT');
    const state = pluginState.get();
    const { index, schema, newObject, newObjectKey } = data;
    if (schema != state.currentSchema?.name) {
      return;
    }
    if (index > state.objects.length) {
      return;
    }
    const clone = structuredClone(newObject);
    clone._objectKey = newObjectKey;
    const newObjects = state.objects;
    const addedObject = convertObjects(
      [clone],
      state.currentSchema,
      downloadData
    )[0];
    newObjects.splice(index, 1, addedObject);
    const newLastObject = newObjects[newObjects.length - 1];
    pluginState.set({
      ...state,
      objects: [...newObjects],
      totalObjects: state.totalObjects,
      cursor: newLastObject._objectKey as string,
    });
  });

  client.addMenuEntry({
    action: 'clear',
    handler: async () => {
      // pluginState.set({});
    },
  });

  const getRealms = () => {
    client.send('getRealms', undefined).then((realms: RealmsMessage) => {
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
    schema?: string | null,
    realm?: string | null,
    toRestore?: RealmObject[],
    cursor?: string | null
  ): Promise<ObjectsMessage> => {
    const state = pluginState.get();
    console.log('called with', schema, realm);
    if (!state.currentSchema) {
      return Promise.reject();
    }
    return client.send('getObjects', {
      schema: schema ?? state.currentSchema?.name,
      realm: realm ?? state.selectedRealm,
      cursor: cursor === undefined ? null : cursor,
      sortingColumn: state.sortingColumn,
      sortingDirection: state.sortingDirection,
      query: state.query,
    });
  };

  const getObjects = (
    schema?: string | null,
    realm?: string | null,
    toRestore?: RealmObject[],
    cursor?: string | null
  ) => {
    const state = pluginState.get();
    if (!state.currentSchema) {
      return;
    }
    schema = schema ?? state.currentSchema.name;
    realm = realm ?? state.selectedRealm;
    cursor = cursor ?? state.cursor;
    pluginState.set({
      ...state,
      loading: true,
    });
    requestObjects(schema, realm, toRestore, cursor)
      .then(
        (response: ObjectsMessage) => {
          const state = pluginState.get();
          console.log("response",response)
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

          if (!state.currentSchema || state.currentSchema?.name !== schema) {
            return;
          }
          const objects = convertObjects(
            response.objects,
            state.currentSchema,
            downloadData
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
        }
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
    schema: string,
    objectKey: string,
    propertyName: string
  ) => {
    const state = pluginState.get();
    return client.send('downloadData', {
      schema: schema,
      realm: state.selectedRealm,
      objectKey: objectKey,
      propertyName: propertyName,
    });
  };
  const getOneObject = async (schema: string, primaryKey: any) => { //TODO: are we deleting this??
    const state = pluginState.get();
    return client.send('getOneObject', {
      schema: schema,
      realm: state.selectedRealm,
      primaryKey: primaryKey,
    });
  };

  const getSchemas = (realm: string) => {
    client
      .send('getSchemas', { realm: realm })
      .then((schemaResult: SchemaMessage) => {
        const newSchemas = schemaResult.schemas.map((schema) =>
          sortSchemaProperties(schema)
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
    const prevObjects = Array.from(state.objects);
    pluginState.set({
      ...state,
      cursor: null,
      sortingColumn: null,
      query: query,
      objects: [],
    });
    getObjects();
  };

  const addObject = (object: Record<string, unknown>) => {
    const state = pluginState.get();
    console.log('addObject in index', object);
    if (!state.currentSchema) {
      return;
    }
    client
      .send('addObject', {
        realm: state.selectedRealm,
        schema: state.currentSchema?.name,
        object: object,
      })
      .catch((reason) => {
        pluginState.set({ ...state, errorMessage: reason.error });
      });
  };

  const setSelectedSchema = (schema: SchemaObject) => {
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

  const goBackSchemaHistory = (schema: SchemaObject) => {
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

  const goForwardSchemaHistory = (schema: SchemaObject) => {
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
      deviceSerial: client.device.description.serial,
    });
    getRealms();
  });

  const modifyObject = (newObject: RealmObject, propsChanged: Set<string>) => {
    const state = pluginState.get();
    // console.log('modifyObject', newObject);
    // const newFields: Record<string, unknown> = {};
    // propsChanged.forEach((propName) => {
    //   newFields[propName] = newObject[propName];
    // });
    // newFields['_id'] = newObject['_id'];
    client
      .send('modifyObject', {
        realm: state.selectedRealm,
        schema: state.currentSchema?.name,
        object: newObject,
        objectKey: newObject._objectKey,
        propsChanged: Array.from(propsChanged.values()),
      })
      .catch((e) => {
        pluginState.set({
          ...state,
          errorMessage: e.message,
        });
      });
  };

  const removeObject = (object: RealmObject) => {
    console.log('sending removeObject', object);
    const state = pluginState.get();
    const schema = state.currentSchema;
    if (!schema) {
      return;
    }
    client.send('removeObject', {
      realm: state.selectedRealm,
      schema: schema.name,
      object: object,
      objectKey: object._objectKey,
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
    getOneObject,
    clearError,
    requestObjects,
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
    'data'
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
          <SchemaVisualizer
            schemas={schemas}
            currentSchema={currentSchema}
          ></SchemaVisualizer>
        </>
      ) : null}
      {/* {viewMode === 'RQL' ? <></> : null} */}
      {viewMode === 'schemaGraph' ? (
        <SchemaGraph
          schemas={schemas}
          selectedRealm={selectedRealm}
        ></SchemaGraph>
      ) : null}
    </>
  );
}
