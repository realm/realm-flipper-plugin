import { createState, PluginClient, usePlugin, useValue } from 'flipper-plugin';

import React, { useState } from 'react';
import {
  AddLiveObjectRequest,
  DeleteLiveObjectRequest,
  EditLiveObjectRequest,
  Events,
  Methods,
  ObjectMessage,
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
    cursorId: null,
    filterCursor: 0,
    selectedPageSize: 50,
    totalObjects: 0,
    currentPage: 1,
    sortingColumn: null,
    sortingDirection: null,
    hasMore: false,
    sortingColumnType: null,
    currentSchema: null,
    query: '',
    errorMessage: '',
  });
  client.onMessage('getOneObject', (data: ObjectMessage) => {
    const state = pluginState.get();
    pluginState.set({ ...state, singleObject: data.object });
  });

  client.onMessage('getCurrentQuery', () => {
    const state = pluginState.get();
    client.send('receivedCurrentQuery', {
      schema: state.currentSchema.name,
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
    const state = pluginState.get();
    const { newObject, index } = data;
    const upperIndex = state.currentPage * state.selectedPageSize - 1;
    const lowerIndex = (state.currentPage - 1) * state.selectedPageSize;
    if (index > upperIndex || index < lowerIndex) {
      return false;
    }
    let newObjects = state.objects;
    newObjects.splice(
      index - (state.currentPage - 1) * state.selectedPageSize,
      0,
      newObject
    );
    const newFirstObject = newObjects[0];
    const newLastObject = newObjects[newObjects.length - 1];
    pluginState.set({
      ...state,
      objects: [...newObjects],
      totalObjects: state.totalObjects - 1,
      cursorId: newLastObject._id,
      filterCursor: state.sortingColumn
        ? newLastObject[state.sortingColumn]
        : null,
      prev_page_cursorId: newFirstObject._id,
      prev_page_filterCursor: state.sortingColumn
        ? newFirstObject[state.sortingColumn]
        : null,
    });
  });

  client.onMessage('liveObjectDeleted', (data: DeleteLiveObjectRequest) => {
    console.log('DELETE');
    const state = pluginState.get();
    const { index } = data;
    const upperIndex = state.currentPage * state.selectedPageSize - 1;
    const lowerIndex = (state.currentPage - 1) * state.selectedPageSize;
    if (index > upperIndex || index < lowerIndex) {
      return false;
    }
    let newObjects = state.objects;
    newObjects.splice(
      index - (state.currentPage - 1) * state.selectedPageSize,
      1
    );

    console.log('after', newObjects);
    const newFirstObject = newObjects[0];
    const newLastObject = newObjects[newObjects.length - 1];
    console.log(newFirstObject, newLastObject);
    pluginState.set({
      ...state,
      objects: [...newObjects],
      totalObjects: state.totalObjects - 1,
      cursorId: newLastObject._id,
      filterCursor: state.sortingColumn
        ? newLastObject[state.sortingColumn]
        : null,
      prev_page_cursorId: newFirstObject._id,
      prev_page_filterCursor: state.sortingColumn
        ? newFirstObject[state.sortingColumn]
        : null,
    });
  });

  client.onMessage('liveObjectEdited', (data: EditLiveObjectRequest) => {
    console.log('EDIT');
    const state = pluginState.get();
    const { newObject, index } = data;
    const upperIndex = state.currentPage * state.selectedPageSize - 1;
    const lowerIndex = (state.currentPage - 1) * state.selectedPageSize;
    if (index > upperIndex || index < lowerIndex) {
      return false;
    }
    let newObjects = state.objects;
    newObjects.splice(
      index - (state.currentPage - 1) * state.selectedPageSize,
      1,
      newObject
    );
    const newFirstObject = newObjects[0];
    const newLastObject = newObjects[newObjects.length - 1];
    pluginState.set({
      ...state,
      objects: [...newObjects],
      totalObjects: state.totalObjects - 1,
      cursorId: newLastObject._id,
      filterCursor: state.sortingColumn
        ? newLastObject[state.sortingColumn]
        : null,
      prev_page_cursorId: newFirstObject._id,
      prev_page_filterCursor: state.sortingColumn
        ? newFirstObject[state.sortingColumn]
        : null,
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

  const getObjects = (
    schema?: string | null,
    realm?: string | null,
    toRestore?: RealmObject[]
  ) => {
    const state = pluginState.get();
    if (!state.currentSchema) {
      return;
    }
    schema = schema ?? state.currentSchema.name;
    realm = realm ?? state.selectedRealm;
    client
      .send('getObjects', {
        schema: schema,
        realm: realm,
        cursorId: state.cursorId,
        filterCursor: state.filterCursor,
        limit: state.selectedPageSize,
        sortingColumn: state.sortingColumn,
        sortingColumnType: state.sortingColumnType,
        sortDirection: state.sortingDirection,
        query: state.query,
      })
      .then((response: RealmsMessage) => {
        if (response.objects && !response.objects.length) {
          return;
        }
        console.log('got objects:', response.objects[0]._objectKey);
        const state = pluginState.get();
        let objects = response.objects;
        const nextCursor = objects[objects.length - 1];

        if (state.currentSchema.name !== schema) {
          return;
        }
        objects = convertObjects(objects, state.currentSchema, downloadData);
        console.log('objects:', objects[0].data)
        pluginState.set({
          ...state,
          objects: [...state.objects, ...objects],
          filterCursor: state.sortingColumn
            ? nextCursor[state.sortingColumn]
            : null,
          cursorId: nextCursor._id,
          totalObjects: response.total,
          hasMore: response.hasMore,
          errorMessage: '',
        });
      }, (reason) => {
        pluginState.set({
          ...state,
          errorMessage: reason.message,
          objects: toRestore ? toRestore : [],
        });
      });
  };
  const downloadData = (schema: string, objectKey: string, propertyName: string) => {
    const state = pluginState.get();
    return client.send('downloadData', {
      schema: schema,
      realm: state.selectedRealm,
      objectKey: objectKey,
      propertyName: propertyName,
    });
  }
  const getOneObject = async (schema: string, primaryKey: any) => {
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
      schemaHistoryIndex: length,
      filterCursor: null,
      cursorId: null,
      sortingColumn: null,
      sortingColumnType: state.currentSchema.properties['_id'].type,
      currentPage: 1,
      query: query,
      objects: [],
    });
    getObjects(state.currentSchema?.name, state.selectedRealm, prevObjects);
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
        pluginState.set({ ...state, errorMsg: reason.error });
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
      filterCursor: null,
      cursorId: null,
      objects: [],
      sortingColumn: null,
      currentSchema: schema,
      sortingColumnType: schema.properties['_id'].type,
      currentPage: 1,
      query: '',
      errorMessage: '',
    });
  };

  const goBackSchemaHistory = (schema: SchemaObject) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      schemaHistoryIndex: state.schemaHistoryIndex - 1,
      filterCursor: null,
      cursorId: null,
      objects: [],
      sortingColumn: null,
      sortingColumnType: schema.properties['_id'].type,
      currentSchema: schema,
    });
  };

  const goForwardSchemaHistory = (schema: SchemaObject) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      schemaHistoryIndex: state.schemaHistoryIndex + 1,
      filterCursor: null,
      cursorId: null,
      objects: [],
      sortingColumn: null,
      sortingColumnType: schema.properties['_id'].type,
      currentSchema: schema,
    });
  };

  const setSelectedRealm = (realm: string) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedRealm: realm,
      objects: [],
      filterCursor: null,
      cursorId: null,
    });
  };

  const setSelectedPageSize = (
    pageSize: 10 | 25 | 50 | 75 | 100 | 1000 | 2500
  ) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedPageSize: pageSize,
      cursorId: null,
      filterCursor: null,
      objects: [],
      sortingColumn: null,
      sortingColumnType: state.currentSchema?.properties['_id'].type ?? null,
      sortingDirection: null,
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

  const modifyObject = (
    newObject: Record<string, unknown>,
    propsChanged: Set<string>
  ) => {
    const state = pluginState.get();
    // console.log('modifyObject', newObject);
    // const newFields: Record<string, unknown> = {};
    // propsChanged.forEach((propName) => {
    //   newFields[propName] = newObject[propName];
    // });
    // newFields['_id'] = newObject['_id'];
    client.send('modifyObject', {
      realm: state.selectedRealm,
      schema: state.currentSchema?.name,
      object: newObject,
      objectKey: newObject._objectKey,
      propsChanged: Array.from(propsChanged.values()),
    });
  };

  const removeObject = (object: Record<string, unknown>) => {
    console.log('sending removeObject', object);
    const state = pluginState.get();
    const schema = state.currentSchema;
    if (!schema) {
      return;
    }
    client.send('removeObject', {
      realm: state.selectedRealm,
      schema: schema.name,
      objectKey: object._objectKey,
    });
  };

  const setCurrentPage = (currentPage: number) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      currentPage: currentPage,
    });
  };

  const setSortingColumnAndType = (
    sortingColumn: string | null,
    sortingColumnType: string | null
  ) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      objects: [],
      sortingColumn: sortingColumn,
      sortingColumnType: sortingColumnType
        ? sortingColumnType
        : state.currentSchema?.properties['_id'].type,
      filterCursor: null,
      cursorId: null,
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
      setSortingColumnAndType(null, null);
    }
    state = pluginState.get();
    pluginState.set({
      ...state,
      sortingDirection: newSortingDirection,
      filterCursor: null,
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
    //refresh
  };

  const clearError = () => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      errorMsg: undefined,
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
    setSelectedPageSize,
    setCurrentPage,
    setSortingColumnAndType,
    toggleSortingDirection,
    setSortingDirection,
    refreshState,
    getOneObject,
    clearError,
  };
}

export function Component() {
  const { state } = usePlugin(plugin);
  const {
    realms,
    objects,
    schemas,
    sortingDirection,
    sortingColumn,
    currentSchema,
  } = useValue(state);

  const [viewMode, setViewMode] = useState<
    'data' | 'schemas' | 'schemaGraph'
  >('data');

  return (
    <>
      <CommonHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        realms={realms}
      />
      {viewMode === 'data' ? (
        <DataVisualizerWrapper
          schemas={schemas}
          objects={objects}
          currentSchema={currentSchema}
          sortDirection={sortingDirection}
          sortingColumn={sortingColumn}
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
        <SchemaGraph schemas={schemas}></SchemaGraph>
      ) : null}
    </>
  );
}
