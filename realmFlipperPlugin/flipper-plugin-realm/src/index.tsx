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
import ObjectAdder from './components/ObjectAdder';
import PaginationActionGroup from './components/PaginationActionGroup';
import RealmSchemaSelect from './components/RealmSchemaSelect';
import SchemaHistoryActions from './components/SchemaHistoryActions';
import ViewModeTabs from './components/ViewModeTabs';
import { DataVisualizer } from './pages/DataVisualizer';
import { addToHistory, RealmQueryLanguage } from './pages/RealmQueryLanguage';
import SchemaVisualizer from './pages/SchemaVisualizer';

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
    console.log('received', data);
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
    const newSchemas = data.schemas.map((schema) =>
      sortSchemaProperties(schema)
    );

    const state = pluginState.get();
    pluginState.set({ ...state, schemas: newSchemas });
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
    const { newObject, index, smallerNeighbor, largerNeighbor } = data;
    console.log(newObject);
    console.log('objects in state', state.objects);
    const lastObjectInMemory = state.objects[state.objects.length - 1]?._id;
    const firstObjectInMemory = state.objects[0]?._id;
    console.log(
      'neighbors',
      smallerNeighbor,
      largerNeighbor,
      firstObjectInMemory
    );
    console.log('sortDirection', state.sortDirection, state.currentPage);
    console.log("last object new", state.objects[state.objects.length-1])
    if (state.currentPage === 1 && largerNeighbor === firstObjectInMemory) {
      //TODO: set new cursor
      let newObjects = [newObject, ...state.objects];
      newObjects = newObjects.slice(0, state.selectedPageSize);
      pluginState.set({
        ...state,
        objects: [...newObjects],
        totalObjects: state.totalObjects + 1,
        cursorId: state.objects[state.objects.length-1]._id,
        filterCursor: state.sortingColumn ? state.objects[state.objects.length-1][state.sortingColumn] : null,
        prev_page_cursorId: newObject._id,
        prev_page_filterCursor: state.sortingColumn ? newObject[state.sortingColumn] : null,
      });
      return;
    }
    if (state.objects.length >= state.selectedPageSize) {
      if (state.sortDirection === 'ascend') {
        if (
          smallerNeighbor < firstObjectInMemory ||
          largerNeighbor > lastObjectInMemory
        ) {
          return false;
        }
      } else {
        console.log('descending');
        if (
          largerNeighbor > firstObjectInMemory ||
          smallerNeighbor < lastObjectInMemory
        ) {
          return false;
        }
      }
    }

    console.log('inserting');
    let newObjects = state.objects;
    const objectsLength = state.objects.length;
    for (let i = 1; i < objectsLength; i++) {
      if (
        (state.objects[i - 1]._id === smallerNeighbor ||
          state.objects[i - 1]._id === largerNeighbor) &&
        (state.objects[i]._id === largerNeighbor ||
          state.objects[i]._id === smallerNeighbor)
      ) {
        newObjects.splice(i, 0, newObject);
        break;
      } else if (!largerNeighbor && !smallerNeighbor) {
        newObjects.push(newObject);
        break;
      } else if (!largerNeighbor || !smallerNeighbor) {
        console.log('this case');
        //TODO: set new cursor
        newObjects.push(newObject);
        break;
      }
    }
    newObjects = newObjects.slice(0, state.selectedPageSize);
    pluginState.set({
      ...state,
      objects: [...newObjects],
      totalObjects: state.totalObjects + 1,
    });
  });

  client.onMessage('liveObjectDeleted', (data: DeleteLiveObjectRequest) => {
    const state = pluginState.get();
    console.log('delete');
    const newObjects = [...state.objects];
    newObjects.splice(data.index, 1);
    pluginState.set({
      ...state,
      objects: newObjects,
      totalObjects: state.totalObjects - 1,
    });
  });

  client.onMessage('liveObjectEdited', (data: EditLiveObjectRequest) => {
    console.log('edit');
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

  const getObjects = (
    schema?: string | null,
    realm?: string | null,
    backwards?: boolean
  ) => {
    const state = pluginState.get();
    setLoading(true);
    if (!state.currentSchema) {
      return;
    }
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
    if (!state.currentSchema) {
      return;
    }
    client.send('addObject', {
      realm: state.selectedRealm,
      schema: state.currentSchema.name,
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
    // console.log('addObject in index', object)
    if (!state.currentSchema) {
      return;
    }
    client.send('modifyObject', {
      realm: state.selectedRealm,
      schema: state.currentSchema.name,
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

  client.onConnect(async () => {
    getRealms();
  });

  return {
    state: pluginState,
    getObjects,
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
    realms,
    objects,
    schemas,
    loading,
    sortDirection,
    sortingColumn,
    currentSchema,
  } = useValue(state);

  const [viewMode, setViewMode] = useState<'data' | 'schemas' | 'RQL'>('data');
  return (
    <Layout.Container grow>
      <ViewModeTabs viewMode={viewMode} setViewMode={setViewMode} />
      <SchemaHistoryActions />
      <RealmSchemaSelect schemas={schemas} realms={realms} />
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
    </Layout.Container>
  );
}
