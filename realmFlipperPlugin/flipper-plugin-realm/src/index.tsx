import {
  createState,
  Layout,
  PluginClient,
  usePlugin,
  useValue,
} from 'flipper-plugin';

import React, { useState } from 'react';
import PaginationActionGroup from './components/PaginationActionGroup';
import RealmSchemaSelect from './components/RealmSchemaSelect';
import SchemaHistoryActions from './components/SchemaHistoryActions';
import { DataVisualizer } from './pages/DataVisualizer';
import { addToHistory, RealmQueryLanguage } from './pages/RealmQueryLanguage';
import SchemaVisualizer from './pages/SchemaVisualizer';
import {
  Events,
  Methods,
  RealmPluginState,
  RealmsMessage,
  ObjectsMessage,
  ObjectMessage,
  SchemaMessage,
  AddLiveObjectRequest,
  DeleteLiveObjectRequest,
  EditLiveObjectRequest,
  SchemaObject,
  SchemaObjectWithOrder,
} from './CommonTypes';
import ViewModeTabs from './components/ViewModeTabs';
import ObjectAdder from './components/ObjectAdder';

// Read more: https://fbflipper.com/docs/tutorial/js-custom#creating-a-first-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#pluginclient
export function plugin(client: PluginClient<Events, Methods>) {
  const pluginState = createState<RealmPluginState>({
    realms: [],
    selectedRealm: '',
    objects: [],
    schemas: [],
    selectedSchema: '',
    schemaHistory: [],
    schemaHistoryIndex: 1,
    cursorId: null,
    filterCursor: 0,
    selectedPageSize: 100,
    totalObjects: 0,
    currentPage: 1,
    sortingColumn: null,
    loading: false,
    sortDirection: null,
    prev_page_cursorId: null,
    prev_page_filterCursor: null,
  });

  client.onMessage('getRealms', (data: RealmsMessage) => {
    const state = pluginState.get();
    pluginState.set({ ...state, realms: data.realms });
  });

  client.onMessage('getObjects', (data: ObjectsMessage) => {
    const state = pluginState.get();
    if (!data.objects.length) {
      setLoading(false);
      return;
    }
    const result = data.objects.slice(
      0,
      Math.max(state.selectedPageSize, data.objects.length - 1)
    );
    console.log('fetched objects', data);
    pluginState.set({
      ...state,
      objects: [...result],
      filterCursor: state.sortingColumn
        ? data.next_cursor[state.sortingColumn]
        : null,
      cursorId: data.next_cursor._id,
      totalObjects: data.total,
      loading: false,
      prev_page_cursorId: data.prev_cursor._id,
      prev_page_filterCursor: state.sortingColumn
        ? data.prev_cursor[state.sortingColumn]
        : null,
    });
  });

  client.onMessage('getOneObject', (data: ObjectMessage) => {
    const state = pluginState.get();
    pluginState.set({ ...state, singleObject: data.object });
  });

  client.onMessage('getSchemas', (data: SchemaMessage) => {
    const newschemas = data.schemas.map((schema) =>
      sortSchemaProperties(schema)
    );

    const state = pluginState.get();
    pluginState.set({ ...state, schemas: newschemas });
    console.log('pluginState', pluginState);
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
    const { newObject } = data;
    pluginState.set({ ...state, objects: [...state.objects, newObject] });
  });

  client.onMessage('liveObjectDeleted', (data: DeleteLiveObjectRequest) => {
    const state = pluginState.get();
    const newObjects = [...state.objects];
    newObjects.splice(data.index, 1);
    pluginState.set({ ...state, objects: newObjects });
  });

  client.onMessage('liveObjectEdited', (data: EditLiveObjectRequest) => {
    const state = pluginState.get();
    const { newObject } = data;
    const newObjects = [...state.objects];
    newObjects.splice(data.index, 1, newObject);
    pluginState.set({ ...state, objects: newObjects });
  });

  client.addMenuEntry({
    action: 'clear',
    handler: async () => {
      // pluginState.set({});
    },
  });

  const getRealms = () => {
    client.send('getRealms', undefined);
  };

  const getObjectsBackwards = (
    schema?: string | null,
    realm?: string | null
  ) => {
    const state = pluginState.get();
    setLoading(true);
    schema = schema ?? state.selectedSchema;
    realm = realm ?? state.selectedRealm;
    client.send('getObjectsBackwards', {
      schema: schema,
      realm: realm,
      prev_page_filterCursor: state.prev_page_filterCursor,
      limit: state.selectedPageSize,
      sortingColumn: state.sortingColumn,
      sortDirection: state.sortDirection,
      prev_page_cursorId: state.prev_page_cursorId,
    });
  };

  const getObjectsForward = (schema?: string | null, realm?: string | null) => {
    const state = pluginState.get();
    setLoading(true);
    schema = schema ?? state.selectedSchema;
    realm = realm ?? state.selectedRealm;
    client.send('getObjects', {
      schema: schema,
      realm: realm,
      cursorId: state.cursorId,
      filterCursor: state.filterCursor,
      limit: state.selectedPageSize,
      sortingColumn: state.sortingColumn,
      sortDirection: state.sortDirection,
    });
  };

  const getOneObject = (event: { schema: string; primaryKey: string }) => {
    const state = pluginState.get();
    console.log('myRealm', event);
    client.send('getOneObject', {
      schema: event.schema,
      realm: state.selectedRealm,
      primaryKey: event.primaryKey,
    });
  };

  const getSchemas = (realm: string) => {
    client.send('getSchemas', { realm: realm });
  };

  const executeQuery = async (query: string, schema: string) => {
    const state = pluginState.get();
    addToHistory(query);
    return client.send('executeQuery', {
      query: query,
      realm: state.selectedRealm,
      schema: schema,
    });
  };

  const addObject = (object: Record<string, unknown>) => {
    const state = pluginState.get();
    // console.log('addObject in index', object)
    client.send('addObject', {
      realm: state.selectedRealm,
      schema: state.selectedSchema,
      object: object,
    });
  };

  const getSchemaFromName = (schemaName: string) => {
    const state = pluginState.get();
    return state.schemas.find((schema) => schema.name === schemaName);
  };

  const updateSelectedSchema = (schema: SchemaObject) => {
    //TODO: fix later //selectedSchema
    const state = pluginState.get();
    const newHistory = Array.from(state.schemaHistory);
    const index = state.schemaHistoryIndex;
    newHistory.splice(index + 1);
    newHistory.push(schema);
    const length = newHistory.length - 1;
    pluginState.set({
      ...state,
      selectedSchema: schema,
      schemaHistory: [...newHistory],
      schemaHistoryIndex: length,
      filterCursor: null,
      cursorId: null,
      objects: [],
      sortingColumn: null,
      currentSchema: getSchemaFromName(schema),
    });
  };

  const goBackSchemaHistory = (schema: string) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedSchema: schema,
      schemaHistoryIndex: state.schemaHistoryIndex - 1,
      filterCursor: null,
      cursorId: null,
      objects: [],
      sortingColumn: null,
      currentSchema: getSchemaFromName(schema),
    });
  };

  const goForwardSchemaHistory = (schema: string) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedSchema: schema,
      schemaHistoryIndex: state.schemaHistoryIndex + 1,
      filterCursor: null,
      cursorId: null,
      objects: [],
      sortingColumn: null,
      currentSchema: getSchemaFromName(schema),
    });
  };

  const updateSelectedRealm = (realm: string) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedRealm: realm,
      objects: [],
      filterCursor: null,
      cursorId: null,
    });
  };

  const updateSelectedPageSize = (
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
    });
  };

  client.onConnect(() => {
    getRealms();
  });

  const modifyObject = (newObject: Record<string, unknown>) => {
    const state = pluginState.get();
    // console.log('addObject in index', object)
    client.send('modifyObject', {
      realm: state.selectedRealm,
      schema: state.selectedSchema,
      object: newObject,
    });
  };

  const removeObject = (object: Record<string, unknown>) => {
    const state = pluginState.get();

    client.send('removeObject', {
      realm: state.selectedRealm,
      schema: state.selectedSchema,
      object: object,
    });
  };

  const setCurrentPage = (currentPage: number) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      currentPage: currentPage,
    });
  };

  const setSortingColumn = (sortingColumn: string | null) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      objects: [],
      sortingColumn: sortingColumn,
      filterCursor: null,
      cursorId: null,
    });
  };

  const setLoading = (loading: boolean) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      loading: loading,
    });
  };

  const toggleSortDirection = () => {
    let state = pluginState.get();
    let newSortingDirection: 'ascend' | 'descend' | null = null;
    if (state.sortDirection === null) {
      newSortingDirection = 'ascend';
    } else if (state.sortDirection === 'ascend') {
      newSortingDirection = 'descend';
    } else {
      newSortingDirection = null;
      setSortingColumn(null);
    }
    state = pluginState.get();
    pluginState.set({
      ...state,
      sortDirection: newSortingDirection,
      filterCursor: null,
      objects: [],
    });
  };

  const setSortingDirection = (direction: 'ascend' | 'descend' | null) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      sortDirection: direction,
    });
  };

  const refreshState = () => {
    pluginState.set({
      realms: [],
      selectedRealm: '',
      objects: [],
      queryResult: [],
      singleObject: {},
      schemas: [],
      selectedSchema: '',
      schemaHistory: [],
      schemaHistoryIndex: 1,
      cursorId: null,
      filterCursor: 0,
      selectedPageSize: 100,
      totalObjects: 0,
      currentPage: 1,
      sortingColumn: null,
      loading: false,
      sortDirection: null,
      prev_page_cursorId: null,
      prev_page_filterCursor: null,
    });
    getRealms();
  };

  client.onConnect(async () => {
    getRealms();
  });

  return {
    state: pluginState,
    getObjectsForward,
    getObjectsBackwards,
    getOneObject,
    getSchemas,
    executeQuery,
    addObject,
    updateSelectedSchema,
    updateSelectedRealm,
    modifyObject,
    removeObject,
    goBackSchemaHistory,
    goForwardSchemaHistory,
    updateSelectedPageSize,
    setCurrentPage,
    setSortingColumn,
    toggleSortDirection,
    setSortingDirection,
    refreshState,
  };
}

export function Component() {
  const { state } = usePlugin(plugin);
  const {
    objects,
    schemas,
    loading,
    selectedSchema,
    sortDirection,
    sortingColumn,
    currentSchema,
  } = useValue(state);

  const [viewMode, setViewMode] = useState<'data' | 'schemas' | 'RQL'>('data');
  return (
    <Layout.Container grow>
      <ViewModeTabs viewMode={viewMode} setViewMode={setViewMode} />
      <SchemaHistoryActions />
      <RealmSchemaSelect />
      {viewMode === 'data' && currentSchema ? (
        <Layout.Container height={800}>
          <Layout.Horizontal style={{ alignItems: 'center', display: 'flex' }}>
            {objects.length > 20 ? <PaginationActionGroup /> : null}
            <ObjectAdder schema={currentSchema} />
          </Layout.Horizontal>
          <DataVisualizer
            objects={objects}
            schemas={schemas}
            loading={loading}
            selectedSchema={selectedSchema}
            sortDirection={sortDirection}
            sortingColumn={sortingColumn}
          />
          <PaginationActionGroup />
        </Layout.Container>
      ) : null}
      {viewMode === 'schemas' ? (
        <SchemaVisualizer
          schemas={schemas}
          selectedSchema={selectedSchema}
        ></SchemaVisualizer>
      ) : null}
      {viewMode === 'RQL' ? (
        <RealmQueryLanguage schema={currentSchema} />
      ) : null}
    </Layout.Container>
  );
}
