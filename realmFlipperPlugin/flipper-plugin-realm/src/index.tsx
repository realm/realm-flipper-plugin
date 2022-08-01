import {
  ConsoleSqlOutlined,
  SettingOutlined,
  TableOutlined,
} from "@ant-design/icons";
import { Radio, RadioChangeEvent, Typography } from 'antd';
import { createState, Layout, PluginClient, Toolbar, usePlugin, useValue } from 'flipper-plugin';
import React from "react";
import { useCallback } from "react";
import RealmSchemaSelect from "./components/RealmSchemaSelect";
import SchemaHistoryActions from "./components/SchemaHistoryActions";
import DataVisualizer from "./pages/DataVisualizer";
import { RealmQueryLanguage, addToHistory } from "./pages/RealmQueryLanguage";
import SchemaVisualizer from "./pages/SchemaVisualizer";

export type RealmPluginState = {
  realms: string[],
  selectedRealm: string, 
  objects: Array<Object>,
  singleObject: Object,
  schemas: Array<SchemaResponseObject>,
  viewMode: 'data' | 'schemas' | 'RQL',
  query: String,
  errorMsg?: String
  selectedSchema: string,
  schemaHistory: Array<string>,
  schemaHistoryIndex: number
}

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
  getObjects: (data: SchemaRequest) => Promise<Object[]>;
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

type SchemaRequest = {
  schema: string;
  realm: string;
}

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
  query: String;
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
    selectedRealm: "",
    objects: [],
    singleObject: {},
    schemas: [],
    viewMode: "data",
    query: "",
    selectedSchema: "",
    schemaHistory: [],
    schemaHistoryIndex: 1
  });

  client.onMessage("getRealms", (data: RealmsMessage) => {
    const state = pluginState.get();
    pluginState.set({ ...state, realms: data.realms });
  });

  client.onMessage("getObjects", (data: ObjectsMessage) => {
    console.log("received objects", data.objects);
    const state = pluginState.get();
    pluginState.set({ ...state, objects: data.objects });
  });

  client.onMessage("getOneObject", (data: ObjectMessage) => {
    console.log("received object", data.object);
    const state = pluginState.get();
    pluginState.set({ ...state, singleObject: data.object });
  });

  client.onMessage("getSchemas", (data: SchemaMessage) => {
    console.log("received schemas", data.schemas);
    const state = pluginState.get();
    pluginState.set({ ...state, schemas: data.schemas });
  });

  client.onMessage("executeQuery", (data: QueryResult) => {
    const state = pluginState.get();
    if (typeof data.result === "string") {
      console.log("query failed", data.result);
      pluginState.set({ ...state, errorMsg: data.result });
    } else {
      console.log("query succeeded", data.result);
      pluginState.set({ ...state, objects: data.result, errorMsg: undefined });
    }
  });

  client.onMessage("liveObjectAdded", (data: AddLiveObjectRequest) => {
    const state = pluginState.get();
    const { newObject } = data;
    pluginState.set({ ...state, objects: [...state.objects, newObject] });
  });

  client.onMessage("liveObjectDeleted", (data: DeleteLiveObjectRequest) => {
    const state = pluginState.get();
    const newObjects = [...state.objects];
    newObjects.splice(data.index, 1);
    pluginState.set({ ...state, objects: newObjects });
  });

  client.onMessage("liveObjectEdited", (data: EditLiveObjectRequest) => {
    const state = pluginState.get();
    const { newObject } = data;
    const newObjects = [...state.objects];
    newObjects.splice(data.index, 1, newObject);
    pluginState.set({ ...state, objects: newObjects });
  });

  client.addMenuEntry({
    action: "clear",
    handler: async () => {
      // pluginState.set({});
    },
  });

  const getRealms = () => {
    client.send("getRealms", undefined);
  };

  const getObjects = (event: {
    schema: string;
    realm: string;
  }) => {
    console.log("myRealm",event);
    client.send("getObjects", ({schema: event.schema, realm: event.realm}))
  }

  const getOneObject = (event: { schema: string; primaryKey: string }) => {
    const state = pluginState.get();
    console.log("myRealm", event);
    client.send("getOneObject", {
      schema: event.schema,
      realm: state.selectedRealm,
      primaryKey: event.primaryKey,
    });
  };

  const getSchemas = (realm: string) => {
    client.send("getSchemas", { realm: realm });
  };

  const updateViewMode = (event: { viewMode: "data" | "schemas" | "RQL" }) => {
    pluginState.update((state) => {
      state.viewMode = event.viewMode;
      // state.error = null;
    });
  };

  const executeQuery = () => {
    const state = pluginState.get();
    addToHistory(state.query);

    client.send("executeQuery", {
      query: state.query,
      realm: state.selectedRealm,
      schema: state.selectedSchema,
    });
  };

  const addObject = (object: Object) => {
    const state = pluginState.get();
    // console.log('addObject in index', object)
    client.send("addObject", {
      realm: state.selectedRealm,
      schema: state.selectedSchema,
      object: object,
    });
  };

  const updateSelectedSchema = (event: { schema: string }) => {
    const state = pluginState.get();
    let newHistory = Array.from(state.schemaHistory);
    const index = state.schemaHistoryIndex;
    newHistory.splice(index + 1);
    newHistory.push(event.schema);
    const length = newHistory.length - 1;
    pluginState.set({
      ...state,
      selectedSchema: event.schema,
      schemaHistory: [...newHistory],
      schemaHistoryIndex: length,
    });
  };

  const goBackSchemaHistory = (event: { schema: string }) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedSchema: event.schema,
      schemaHistoryIndex: state.schemaHistoryIndex - 1,
    });
  };

  const goForwardSchemaHistory = (event: { schema: string }) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedSchema: event.schema,
      schemaHistoryIndex: state.schemaHistoryIndex + 1,
    });
  };

  const updateSelectedRealm = (event: { realm: string }) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedRealm: event.realm,
    });
  };

  client.onConnect( () => {
    getRealms();
  });

  const modifyObject = (newObject: Object) => {
    const state = pluginState.get();
    // console.log('addObject in index', object)
    client.send("modifyObject", {
      realm: state.selectedRealm,
      schema: state.selectedSchema,
      object: newObject,
    });
  };

  const removeObject = (object: Object) => {
    const state = pluginState.get();

    client.send("removeObject", {
      realm: state.selectedRealm,
      schema: state.selectedSchema,
      object: object,
    });
  };

  client.onConnect( async () => {
    await setTimeout(() => {}, 4000)
    getRealms();
  });
  return {state: pluginState, getObjects, getOneObject, getSchemas, updateViewMode, executeQuery, addObject, updateSelectedSchema, updateSelectedRealm, modifyObject, removeObject, goBackSchemaHistory, goForwardSchemaHistory};
}

export function Component() {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const onViewModeChanged = useCallback(
    (evt: RadioChangeEvent) => {
      instance.updateViewMode({ viewMode: evt.target.value ?? "data" });
    },
    [instance]
  );

  const onDataClicked = useCallback(() => {
    instance.updateViewMode({ viewMode: "data" });
  }, [instance]);

  const onSchemasClicked = useCallback(() => {
    instance.updateViewMode({ viewMode: "schemas" });
  }, [instance]);

  const onRQLClicked = useCallback(() => {
    instance.updateViewMode({ viewMode: "RQL" });
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
      {state.viewMode === "data" ? (
        <DataVisualizer
          objects={state.objects}
          singleObject={state.singleObject}
          schemas={state.schemas}
          selectedSchema={state.selectedSchema}
          addObject={instance.addObject}
          modifyObject={instance.modifyObject}
          removeObject={instance.removeObject}
          getOneObject={instance.getOneObject}
        />
      ) : null}
      {state.viewMode === "schemas" ? (
        <SchemaVisualizer
          schemas={state.schemas}
          selectedSchema={state.selectedSchema}
        ></SchemaVisualizer>
      ) : null}
      {state.viewMode === "RQL" ? (
        <>
          <RealmQueryLanguage instance={instance}></RealmQueryLanguage>
        </>
      ) : null}
    </Layout.ScrollContainer>
  );
}
