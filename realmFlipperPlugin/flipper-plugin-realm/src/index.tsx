import {
  ConsoleSqlOutlined,
  SettingOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { Radio, RadioChangeEvent, Typography } from 'antd';
import {
  createState,
  Layout,
  PluginClient,
  Toolbar,
  usePlugin,
  useValue,
} from 'flipper-plugin';

import React, { useCallback, useState } from 'react';
import { RealmObject } from './CommonTypes';
import RealmSchemaSelect from './components/RealmSchemaSelect';
import SchemaHistoryActions from './components/SchemaHistoryActions';
import DataVisualizer from './pages/DataVisualizer';
import { addToHistory, RealmQueryLanguage } from './pages/RealmQueryLanguage';
import SchemaVisualizer from './pages/SchemaVisualizer';

export type RealmPluginState = {
  realms: string[];
  selectedRealm: string;
  objects: Array<RealmObject>;
  singleObject: RealmObject;
  schemas: Array<SchemaResponseObject>;
  errorMsg?: string;
  currentSchema?: SchemaResponseObject;
  selectedSchema: string;
  schemaHistory: Array<string>;
  schemaHistoryIndex: number;
  cursorId: number | null;
  filterCursor: number | null;
  selectedPageSize: 10 | 25 | 50 | 75 | 100 | 1000 | 2500;
  currentPage: number;
  totalObjects: number;
  sortingColumn: string | null;
  loading: boolean;
  sortDirection: 'ascend' | 'descend' | null;
  prev_page_cursorId: number | null;
  prev_page_filterCursor: number | null;
};

export type SchemaResponseObject = {
  name: string;
  embedded: boolean;
  asymmetric: boolean;
  primaryKey: string;
  properties: { [key: string]: SchemaPropertyValue };
};

export type SchemaPropertyValue = {
  name: string;
  indexed: boolean;
  optional: boolean;
  type: string;
  mapTo: string;
  objectType?: string;
};

type Events = {
  getObjects: ObjectsMessage;
  getOneObject: ObjectMessage;
  getSchemas: SchemaMessage;
  liveObjectAdded: AddLiveObjectRequest;
  liveObjectDeleted: DeleteLiveObjectRequest;
  liveObjectEdited: EditLiveObjectRequest;
  getRealms: RealmsMessage;
  executeQuery: QueryResult;
};

type Methods = {
  executeQuery: (query: QueryObject) => Promise<Record<string, unknown>[]>;
  getObjects: (
    data: getForwardsObjectsRequest
  ) => Promise<Record<string, unknown>[]>;
  getObjectsBackwards: (
    data: getBackwardsObjectsRequest
  ) => Promise<Record<string, unknown>[]>;
  getOneObject: (data: ObjectRequest) => Promise<Record<string, unknown>>;
  getSchemas: (data: RealmRequest) => Promise<SchemaResponseObject[]>;
  getRealms: () => Promise<string[]>;
  addObject: (object: AddObject) => Promise<Record<string, unknown>>;
  modifyObject: (newObject: AddObject) => Promise<Record<string, unknown>>;
  removeObject: (object: AddObject) => Promise<void>;
};

export type AddObject = {
  schema?: string;
  realm?: string;
  object: Record<string, unknown>;
};

type RealmsMessage = {
  realms: string[];
};

type ObjectsMessage = {
  objects: Array<Record<string, unknown>>;
  total: number;
  next_cursor: { [sortingField: string]: number };
  prev_cursor: { [sortingField: string]: number };
};

type ObjectMessage = {
  object: Record<string, unknown>;
};

type SchemaMessage = {
  schemas: Array<SchemaResponseObject>;
};

type RealmRequest = {
  realm: string;
};

type getForwardsObjectsRequest = {
  schema: string;
  realm: string;
  filterCursor: string | number | null;
  cursorId: number | null;
  limit: number;
  sortingColumn: string | null;
  sortDirection: 'ascend' | 'descend' | null;
};

type getBackwardsObjectsRequest = {
  schema: string;
  realm: string;
  prev_page_filterCursor: string | number | null;
  prev_page_cursorId: number | null;
  limit: number;
  sortingColumn: string | null;
  sortDirection: 'ascend' | 'descend' | null;
};

export type ObjectRequest = {
  schema: string;
  realm: string;
  primaryKey: string;
};

type AddLiveObjectRequest = {
  newObject: Record<string, unknown>;
};

type DeleteLiveObjectRequest = {
  index: number;
};

type EditLiveObjectRequest = {
  newObject: Record<string, unknown>;
  index: number;
};

type QueryObject = {
  schema: string;
  query: string;
  realm: string;
};

type QueryResult = {
  result: Array<Record<string, unknown>> | string;
};

// Read more: https://fbflipper.com/docs/tutorial/js-custom#creating-a-first-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#pluginclient
export function plugin(client: PluginClient<Events, Methods>) {
  const pluginState = createState<RealmPluginState>({
    realms: [],
    selectedRealm: '',
    objects: [],
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
    console.log('received object', data.object);
    const state = pluginState.get();
    pluginState.set({ ...state, singleObject: data.object });
  });

  client.onMessage('getSchemas', (data: SchemaMessage) => {
    console.log('received schemas', data.schemas);
    const state = pluginState.get();
    pluginState.set({ ...state, schemas: data.schemas });
  });

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

  const getObjectsBackwards = (event: {
    schema: string | null;
    realm: string | null;
  }) => {
    const state = pluginState.get();
    setLoading(true);
    event.schema = event.schema ?? state.selectedSchema;
    event.realm = event.realm ?? state.selectedRealm;
    client.send('getObjectsBackwards', {
      schema: event.schema,
      realm: event.realm,
      prev_page_filterCursor: state.prev_page_filterCursor,
      limit: state.selectedPageSize,
      sortingColumn: state.sortingColumn,
      sortDirection: state.sortDirection,
      prev_page_cursorId: state.prev_page_cursorId,
    });
  };

  const getObjectsFoward = (event: {
    schema: string | null;
    realm: string | null;
  }) => {
    const state = pluginState.get();
    setLoading(true);
    event.schema = event.schema ?? state.selectedSchema;
    event.realm = event.realm ?? state.selectedRealm;
    client.send('getObjects', {
      schema: event.schema,
      realm: event.realm,
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

  const executeQuery = async (query: string) => {
    const state = pluginState.get();
    addToHistory(query);
    return client.send('executeQuery', {
      query: query,
      realm: state.selectedRealm,
      schema: state.selectedSchema,
    });

    // try {
    //   const result = await
    //   return result;
    // }
    // catch(e) {
    //   return e;
    // }
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

  const updateSelectedSchema = (schema: string) => {
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

  client.onConnect(async () => {
    getRealms();
  });

  return {
    state: pluginState,
    getObjectsFoward,
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
  };
}

export function Component() {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  const [viewMode, setViewMode] = useState<'data' | 'schemas' | 'RQL'>('data');

  return (
    <Layout.Container grow>
      <Toolbar position="top">
        <Radio.Group value={viewMode}>
          <Radio.Button value="data" onClick={() => setViewMode('data')}>
            <TableOutlined style={{ marginRight: 5 }} />
            <Typography.Text>Data</Typography.Text>
          </Radio.Button>
          <Radio.Button onClick={() => setViewMode('schemas')} value="schemas">
            <SettingOutlined style={{ marginRight: 5 }} />
            <Typography.Text>Schema</Typography.Text>
          </Radio.Button>
          <Radio.Button onClick={() => setViewMode('RQL')} value="RQL">
            <ConsoleSqlOutlined style={{ marginRight: 5 }} />
            <Typography.Text>RQL</Typography.Text>
          </Radio.Button>
        </Radio.Group>
      </Toolbar>
      <SchemaHistoryActions />
      <RealmSchemaSelect></RealmSchemaSelect>
      {viewMode === 'data' ? (
        <DataVisualizer
          // objects={state.objects.slice(
          //   (state.currentPage - 1) * state.selectedPageSize,
          //   state.currentPage * state.selectedPageSize
          // )}
          objects={state.objects}
          singleObject={state.singleObject}
          schemas={state.schemas}
          loading={state.loading}
          selectedSchema={state.selectedSchema}
          sortDirection={state.sortDirection}
          sortingColumn={state.sortingColumn}
          addObject={instance.addObject}
          modifyObject={instance.modifyObject}
          removeObject={instance.removeObject}
          getOneObject={instance.getOneObject}
        />
      ) : null}
      {viewMode === 'schemas' ? (
        <SchemaVisualizer
          schemas={state.schemas}
          selectedSchema={state.selectedSchema}
        ></SchemaVisualizer>
      ) : null}
      {viewMode === 'RQL' ? (
        <>
          <RealmQueryLanguage schema={state.currentSchema} />
        </>
      ) : null}
    </Layout.Container>
  );
}
