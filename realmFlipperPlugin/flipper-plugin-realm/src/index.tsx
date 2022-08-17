import {
  createState,
  Layout,
  PluginClient,
  usePlugin,
  useValue
} from 'flipper-plugin';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Dropdown, Tooltip } from 'antd';
import React, {useState } from 'react';
import { RealmObject, SchemaProperty } from './CommonTypes';
import { parsePropToCell } from './utils/Parser';
import { ColumnTitle } from './components/ColumnTitle';
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
  SchemaObject
} from './CommonTypes';
import InfinityLoadingList from './components/InfiniteLoadingList';
import RealmSchemaSelect from './components/RealmSchemaSelect';
import SchemaHistoryActions from './components/SchemaHistoryActions';
import ViewModeTabs from './components/ViewModeTabs';
import { addToHistory, RealmQueryLanguage } from './pages/RealmQueryLanguage';
import { SchemaGraph } from './pages/SchemaGraph';
import SchemaVisualizer from './pages/SchemaVisualizer';
import DataVisualizer from './pages/DataVisualizer';
import ObjectAdder from './components/ObjectAdder';

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
    hasMore: false,
    currentSchema: null,
  });

  client.onMessage('getRealms', (data: RealmsMessage) => {
    const state = pluginState.get();
    pluginState.set({ ...state, realms: data.realms });
  });

  client.onMessage('getObjects', (data: ObjectsMessage) => {
    const state = pluginState.get();
    if (!data.objects.length) {
      //setLoading(false);
      return;
    }
    const objects = data.objects;
    const nextCursor = objects[objects.length-1];
    const prevCursor = objects[0];
    pluginState.set({
      ...state,
      objects: [...state.objects, ...data.objects],
      filterCursor: state.sortingColumn
        ? nextCursor[state.sortingColumn]
        : null,
      cursorId: nextCursor._id,
      totalObjects: data.total,
      loading: false,
      prev_page_cursorId: prevCursor._id,
      prev_page_filterCursor: state.sortingColumn
        ? prevCursor[state.sortingColumn]
        : null,
      hasMore: data.hasMore,
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
      sortingColumn: state.sortingColumn,
      sortDirection: state.sortDirection,
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
    const columns = currentSchema?.order.map((key) => {
      const obj = currentSchema.properties[key];
      const isPrimaryKey = obj.name === currentSchema.primaryKey;
      return {
        name: obj.name,
        isOptional: obj.optional,
        objectType: obj.objectType,
        propertyType: obj.type,
        isPrimaryKey: isPrimaryKey,
      };
    });
  const filledColumns = columns?.map((column) => {
    const property: SchemaProperty = currentSchema.properties[column.name];
    return {
      title: () => (
        <ColumnTitle
          isOptional={column.isOptional}
          name={column.name}
          objectType={column.objectType}
          propertyType={column.propertyType}
          isPrimaryKey={column.isPrimaryKey}
        />
      ),
      key: property.name,
      dataIndex: property.name,
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      property,
      render: (value: RealmObject, row: RealmObject) => {
        if (property.objectType && value) {
          console.log('property.objectType', property.objectType);

          const linkedSchema = schemas.find(
            (schema) => schema.name === property.objectType
          );
          if (linkedSchema) {
            return (
              <Layout.Container
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '5px',
                }}
              >
                <Button
                  shape="circle"
                  type="primary"
                  size="small"
                  icon={<SearchOutlined />}
                  //onClick={() => highlightRow(value[currentSchema.primaryKey])}
                  ghost
                />
                <Dropdown
                  //overlay={renderOptions(row, property, currentSchema)}
                  trigger={[`contextMenu`]}
                >
                  <Tooltip placement="topLeft" title={JSON.stringify(value)}>
                    {parsePropToCell(value, property, currentSchema, schemas)}
                  </Tooltip>
                </Dropdown>
              </Layout.Container>
            );
          }
        }
        return (
          <Dropdown
            //overlay={renderOptions(row, property, currentSchema)}
            trigger={[`contextMenu`]}
          >
            <Tooltip placement="topLeft" title={JSON.stringify(value)}>
              {parsePropToCell(value, property, currentSchema, schemas)}
            </Tooltip>
          </Dropdown>
        );
      },
      //sorter: sortableTypes.has(property.type), //TODO: false if object, list, set
      sortOrder: sortingColumn === property.name ? sortDirection : null,
    };
  });

  const [viewMode, setViewMode] = useState<
    'data' | 'schemas' | 'RQL' | 'schemaGraph'
  >('data');
  return (
    <>
      <ViewModeTabs viewMode={viewMode} setViewMode={setViewMode} />
      <SchemaHistoryActions />
      <RealmSchemaSelect schemas={schemas} realms={realms} />
      {viewMode === 'data' ? (
        <div
          style={{
            border: '1px solid #e8e8e8',
            borderRadius: ' 4px',
            overflow: 'auto',
            padding: '8px 24px',
            height: '100%',
          }}
        >
          <Layout.Horizontal style={{ alignItems: 'center', display: 'flex' }}>
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
        {/* <InfinityLoadingList
          objects={objects}
          currentSchema={currentSchema}
          columns={filledColumns}
        />  */}
      </div> ) : 
      null}
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
        <SchemaGraph schemas={schemas}></SchemaGraph>
      ) : null}
    </>
  );
}
