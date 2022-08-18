import {
  createState,
  Layout,
  PluginClient,
  usePlugin,
  useValue,
} from 'flipper-plugin';

import React, { useState } from 'react';
import {
  AddLiveObjectRequest,
  DeleteLiveObjectRequest,
  EditLiveObjectRequest,
  Events,
  Methods,
  ObjectMessage,
  ObjectsMessage,
  RealmPluginState,
  RealmsMessage,
  SchemaMessage,
  SchemaObject,
} from './CommonTypes';
import PaginationActionGroup from './components/PaginationActionGroup';
import RealmSchemaSelect from './components/RealmSchemaSelect';
import SchemaHistoryActions from './components/SchemaHistoryActions';
import ViewModeTabs from './components/ViewModeTabs';
import { DataVisualizer } from './pages/DataVisualizer';
import { addToHistory, RealmQueryLanguage } from './pages/RealmQueryLanguage';
import SchemaVisualizer from './pages/SchemaVisualizer';
import { SchemaGraph } from './pages/SchemaGraph';
import { ObjectAdd } from './components/objectManipulation/ObjectAdd';

// Read more: https://fbflipper.com/docs/tutorial/js-custom#creating-a-first-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#pluginclient
export function plugin(client: PluginClient<Events, Methods>) {
  const pluginState = createState<RealmPluginState>({
    realms: [],
    selectedRealm: '',
    objects: [],
    schemas: [],
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
    currentSchema: null,
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

  client.onMessage('getCurrentQuery', () => {
    const state = pluginState.get();
    client.send('receivedCurrentQuery', {
      schema: state.currentSchema.name,
      realm: state.selectedRealm,
      cursorId: state.cursorId,
      filterCursor: state.filterCursor,
      limit: state.selectedPageSize,
      sortingColumn: state.sortingColumn,
      sortDirection: state.sortDirection,
      prev_page_filterCursor: state.prev_page_filterCursor,
      prev_page_cursorId: state.prev_page_cursorId,
    });
  });

  client.onMessage('getSchemas', (data: SchemaMessage) => {
    console.log('schemas: ', data.schemas);
    const newschemas = data.schemas.map((schema) =>
      sortSchemaProperties(schema)
    );

    const state = pluginState.get();
    pluginState.set({ ...state, schemas: newschemas });
    // console.log('pluginState', pluginState);
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
    const { newObject, index, smallerNeighbor, largerNeighbor } = data;
    // console.log(newObject);
    // console.log('objects in state', state.objects);
    const lastObjectInMemory = state.objects[state.objects.length - 1]?._id;
    const firstObjectInMemory = state.objects[0]?._id;
    // console.log(
    //   'neighbors',
    //   smallerNeighbor,
    //   largerNeighbor,
    //   firstObjectInMemory
    // );
    // console.log('sortDirection', state.sortDirection, state.currentPage);
    // console.log('last object new', state.objects[state.objects.length - 1]);
    if (
      state.currentPage === 1 &&
      state.objects.length >= state.selectedPageSize &&
      !smallerNeighbor
    ) {
      let newObjects = [newObject, ...state.objects];
      newObjects = newObjects.slice(0, state.selectedPageSize);
      // console.log(
      //   'set cursorId to',
      //   state.objects[state.objects.length - 1]._id
      // );

      pluginState.set({
        ...state,
        objects: [...newObjects],
        totalObjects: state.totalObjects + 1,
        cursorId: state.objects[state.objects.length - 1]._id,
        filterCursor: state.sortingColumn
          ? state.objects[state.objects.length - 1][state.sortingColumn]
          : null,
        prev_page_cursorId: newObject._id,
        prev_page_filterCursor: state.sortingColumn
          ? newObject[state.sortingColumn]
          : null,
      });
      return;
    }
    if (state.objects.length >= state.selectedPageSize) {
      if (state.sortDirection === 'descend') {
        console.log('descending');
        if (
          largerNeighbor > firstObjectInMemory ||
          smallerNeighbor < lastObjectInMemory
        ) {
          return false;
        }
      } else {
        if (
          smallerNeighbor < firstObjectInMemory ||
          largerNeighbor > lastObjectInMemory
        ) {
          return false;
        }
      }
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
    client.send('getRealms', undefined);
  };

  const getObjects = (
    schema?: string | null,
    realm?: string | null,
    backwards?: boolean
  ) => {
    const state = pluginState.get();
    if (!state.currentSchema) {
      return;
    }
    setLoading(true);
    schema = schema ?? state.currentSchema.name;
    realm = realm ?? state.selectedRealm;
    client.send('getObjects', {
      schema: schema,
      realm: realm,
      cursorId: state.cursorId,
      filterCursor: state.filterCursor,
      limit: state.selectedPageSize,
      sortingColumn: state.sortingColumn,
      sortDirection: state.sortDirection,
      prev_page_filterCursor: state.prev_page_filterCursor,
      prev_page_cursorId: state.prev_page_cursorId,
      backwards: Boolean(backwards),
    });
  };

  const getOneObject = async (schema: string, primaryKey: any) => {
    const state = pluginState.get();
    return client
      .send('getOneObject', {
        schema: schema,
        realm: state.selectedRealm,
        primaryKey: primaryKey,
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
    console.log('addObject in index', object);
    if (!state.currentSchema) {
      return;
    }
    client.send('addObject', {
      realm: state.selectedRealm,
      schema: state.currentSchema?.name,
      object: object,
    });
  };

  const updateSelectedSchema = (schema: SchemaObject) => {
    const state = pluginState.get();
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
      currentPage: 1,
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
      currentSchema: schema,
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
      sortDirection: null,
    });
  };

  client.onConnect(() => {
    getRealms();
  });

  const modifyObject = (newObject: Record<string, unknown>) => {
    const state = pluginState.get();
    console.log('modifyObject', newObject);
    client.send('modifyObject', {
      realm: state.selectedRealm,
      schema: state.currentSchema?.name,
      object: newObject,
    });
  };

  const removeObject = (object: Record<string, unknown>) => {
    const state = pluginState.get();
    if (!state.currentSchema) {
      return;
    }
    client.send('removeObject', {
      realm: state.selectedRealm,
      schema: state.currentSchema.name,
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

  function updateIsInRange(
    largerNeighbor: number,
    smallerNeighbor: number,
    firstObjectInMemory: number,
    lastObjectInMemory: number,
    state: RealmPluginState
  ) {
    console.log('here');
    if (state.objects.length >= state.selectedPageSize) {
      console.log('here', state.sortDirection);
      if (state.sortDirection === 'descend') {
        console.log('descending');
        if (
          largerNeighbor > firstObjectInMemory ||
          smallerNeighbor < lastObjectInMemory
        ) {
          return false;
        }
      } else {
        if (
          smallerNeighbor < firstObjectInMemory ||
          largerNeighbor > lastObjectInMemory
        ) {
          return false;
        }
      }
    }

    return true;
  }

  const setSortingDirection = (direction: 'ascend' | 'descend' | null) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      sortDirection: direction,
    });
  };

  const refreshState = () => {
    //refresh
  };

  client.onConnect(() => {
    getRealms();
  });

  return {
    state: pluginState,
    getObjects,
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
    getOneObject,
  };
}

export function Component() {
  const { state } = usePlugin(plugin);
  const {
    realms,
    objects,
    schemas,
    loading,
    sortDirection,
    sortingColumn,
    currentSchema,
    selectedRealm
  } = useValue(state);

  const [viewMode, setViewMode] = useState<
    'data' | 'schemas' | 'RQL' | 'schemaGraph'
  >('data');
  return (
    <Layout.Container grow>
      <ViewModeTabs viewMode={viewMode} setViewMode={setViewMode} />
      <SchemaHistoryActions />
      <RealmSchemaSelect schemas={schemas} realms={realms} />
      {viewMode === 'data' ? (
        <Layout.Container height={800}>
          <Layout.Horizontal style={{ alignItems: 'center', display: 'flex' }}>
            {objects.length > 20 ? <PaginationActionGroup /> : null}
            {currentSchema ? <ObjectAdd schema={currentSchema} /> : null}
          </Layout.Horizontal>
          <DataVisualizer
            objects={objects}
            schemas={schemas}
            loading={loading}
            currentSchema={currentSchema}
            sortDirection={sortDirection}
            sortingColumn={sortingColumn}
          />
          <PaginationActionGroup />
        </Layout.Container>
      ) : null}
      {viewMode === 'schemas' ? (
        <SchemaVisualizer
          schemas={schemas}
          currentSchema={currentSchema}
        ></SchemaVisualizer>
      ) : null}
      {viewMode === 'RQL' ? (
        <RealmQueryLanguage schema={currentSchema} />
      ) : null}
      {viewMode === 'schemaGraph' ? (
        <SchemaGraph schemas={schemas} selectedRealm={selectedRealm}></SchemaGraph>
      ) : null}
    </Layout.Container>
  );
}
