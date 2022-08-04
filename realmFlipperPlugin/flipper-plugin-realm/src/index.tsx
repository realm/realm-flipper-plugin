import {
  ConsoleSqlOutlined,
  SettingOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { Button, Radio, RadioChangeEvent, Typography } from 'antd';
import { createState, Layout, PluginClient, Toolbar, usePlugin, useValue } from 'flipper-plugin';

import React, { useEffect } from 'react';
import { useCallback } from 'react';
import RealmSchemaSelect from './components/RealmSchemaSelect';
import SchemaHistoryActions from './components/SchemaHistoryActions';
import DataVisualizer from './pages/DataVisualizer';
import { RealmQueryLanguage, addToHistory } from './pages/RealmQueryLanguage';
import SchemaVisualizer from './pages/SchemaVisualizer';

export type RealmPluginState = {
  realms: string[];
  selectedRealm: string;
  objects: Array<Object>;
  singleObject: Object;
  schemas: Array<SchemaResponseObject>;
  viewMode: 'data' | 'schemas' | 'RQL';
  query: string;
  errorMsg?: string;
  selectedSchema: string;
  schemaHistory: Array<string>;
  schemaHistoryIndex: number;
  cursorId: number | null;
  filterCursor: number | null;
  selectedPageSize: 10 | 100 | 1000 | 2500;
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
  executeQuery: (query: QueryObject) => Promise<Object[]>;
  getObjects: (data: getForwardsObjectsRequest) => Promise<Object[]>;
  getObjectsBackwards: (data: getBackwardsObjectsRequest) => Promise<Object[]>;
  getOneObject: (data: ObjectRequest) => Promise<Object[]>;
  getSchemas: (data: RealmRequest) => Promise<SchemaResponseObject[]>;
  getRealms: () => Promise<string[]>;
  addObject: (object: AddObject) => Promise<any>;
  modifyObject: (newObject: AddObject) => Promise<any>;
  removeObject: (object: AddObject) => Promise<any>;
};

type AddObject = {
  schema: string;
  realm: string;
  object: Object;
};

type RealmsMessage = {
  realms: string[];
};

type ObjectsMessage = {
  objects: Array<Object>;
  total: number;
  next_cursor: CursorObject;
  prev_cursor: CursorObject;
};

type CursorObject = {
  _id: number;
  sortingField: string | number;
};

type ObjectMessage = {
  object: Object;
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

type ObjectRequest = {
  schema: string;
  realm: string;
  primaryKey: string;
};

type AddLiveObjectRequest = {
  newObject: Object;
};

type DeleteLiveObjectRequest = {
  index: number;
};

type EditLiveObjectRequest = {
  newObject: Object;
  index: number;
};

type QueryObject = {
  schema: string;
  query: string;
  realm: string;
};

type QueryResult = {
  result: Array<Object> | string;
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
    viewMode: 'data',
    query: '',
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
      setLoading({ loading: false });
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

  client.onMessage('executeQuery', (data: QueryResult) => {
    const state = pluginState.get();
    if (typeof data.result === 'string') {
      console.log('query failed', data.result);
      pluginState.set({ ...state, errorMsg: data.result });
    } else {
      console.log('query succeeded', data.result);
      pluginState.set({ ...state, objects: data.result, errorMsg: undefined });
    }
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
    setLoading({ loading: true });
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
    setLoading({ loading: true });
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

  const updateViewMode = (event: { viewMode: 'data' | 'schemas' | 'RQL' }) => {
    pluginState.update((state) => {
      state.viewMode = event.viewMode;
    });
  };

  const executeQuery = () => {
    const state = pluginState.get();
    addToHistory(state.query);

    client.send('executeQuery', {
      query: state.query,
      realm: state.selectedRealm,
      schema: state.selectedSchema,
    });
  };

  const addObject = (object: Object) => {
    const state = pluginState.get();
    // console.log('addObject in index', object)
    client.send('addObject', {
      realm: state.selectedRealm,
      schema: state.selectedSchema,
      object: object,
    });
  };

  const updateSelectedSchema = (event: { schema: string }) => {
    const state = pluginState.get();
    const newHistory = Array.from(state.schemaHistory);
    const index = state.schemaHistoryIndex;
    newHistory.splice(index + 1);
    newHistory.push(event.schema);
    const length = newHistory.length - 1;
    pluginState.set({
      ...state,
      selectedSchema: event.schema,
      schemaHistory: [...newHistory],
      schemaHistoryIndex: length,
      filterCursor: null,
      cursorId: null,
      objects: [],
      sortingColumn: null,
    });
  };

  const goBackSchemaHistory = (event: { schema: string }) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedSchema: event.schema,
      schemaHistoryIndex: state.schemaHistoryIndex - 1,
      filterCursor: null,
      cursorId: null,
      objects: [],
      sortingColumn: null,
    });
  };

  const goForwardSchemaHistory = (event: { schema: string }) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedSchema: event.schema,
      schemaHistoryIndex: state.schemaHistoryIndex + 1,
      filterCursor: null,
      cursorId: null,
      objects: [],
      sortingColumn: null,
    });
  };

  const updateSelectedRealm = (event: { realm: string }) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedRealm: event.realm,
      objects: [],
      filterCursor: null,
      cursorId: null,
    });
  };

  const updateSelectedPageSize = (event: {
    pageSize: 10 | 100 | 1000 | 2500;
  }) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedPageSize: event.pageSize,
    });
  };

  client.onConnect(() => {
    getRealms();
  });

  const modifyObject = (newObject: Object) => {
    const state = pluginState.get();
    // console.log('addObject in index', object)
    client.send('modifyObject', {
      realm: state.selectedRealm,
      schema: state.selectedSchema,
      object: newObject,
    });
  };

  const removeObject = (object: Object) => {
    const state = pluginState.get();

    client.send('removeObject', {
      realm: state.selectedRealm,
      schema: state.selectedSchema,
      object: object,
    });
  };

  const setCurrentPage = (event: { currentPage: number }) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      currentPage: event.currentPage,
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

  const setLoading = (event: { loading: boolean }) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      loading: event.loading,
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
    updateViewMode,
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
  const onViewModeChanged = useCallback(
    (evt: RadioChangeEvent) => {
      instance.updateViewMode({ viewMode: evt.target.value ?? 'data' });
    },
    [instance]
  );

  const onDataClicked = useCallback(() => {
    instance.updateViewMode({ viewMode: 'data' });
  }, [instance]);

  const onSchemasClicked = useCallback(() => {
    instance.updateViewMode({ viewMode: 'schemas' });
  }, [instance]);

  const onRQLClicked = useCallback(() => {
    instance.updateViewMode({ viewMode: 'RQL' });
  }, [instance]);

  return (
    <Layout.ScrollContainer>
      <Toolbar position="top">
        <Radio.Group value={state.viewMode} onChange={onViewModeChanged}>
          <Radio.Button value="data" onClick={onDataClicked}>
            <TableOutlined style={{ marginRight: 5 }} />
            <Typography.Text>Data</Typography.Text>
          </Radio.Button>
          <Radio.Button onClick={onSchemasClicked} value="schemas">
            <SettingOutlined style={{ marginRight: 5 }} />
            <Typography.Text>Schema</Typography.Text>
          </Radio.Button>
          <Radio.Button onClick={onRQLClicked} value="RQL">
            <ConsoleSqlOutlined style={{ marginRight: 5 }} />
            <Typography.Text>RQL</Typography.Text>
          </Radio.Button>
        </Radio.Group>
      </Toolbar>
      <SchemaHistoryActions />
      <RealmSchemaSelect></RealmSchemaSelect>
      {state.viewMode === 'data' ? (
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
      {state.viewMode === 'schemas' ? (
        <SchemaVisualizer
          schemas={state.schemas}
          selectedSchema={state.selectedSchema}
        ></SchemaVisualizer>
      ) : null}
      {state.viewMode === 'RQL' ? (
        <>
          <RealmQueryLanguage instance={instance}></RealmQueryLanguage>
        </>
      ) : null}
    </Layout.ScrollContainer>
  );
}
