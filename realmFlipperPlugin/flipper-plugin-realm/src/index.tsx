import {
  ConsoleSqlOutlined,
  SettingOutlined,
  TableOutlined
} from "@ant-design/icons";
import { Radio, RadioChangeEvent, Typography } from 'antd';
import { createState, Layout, PluginClient, Toolbar, usePlugin, useValue } from 'flipper-plugin';
import React from "react";
import { useCallback } from 'react';
import RealmSchemaSelect from './components/RealmSchemaSelect';
import ViewSelecter from './components/ViewSelecter';
import DataVisualizer from './pages/DataVisualizer';
import RealmQueryLanguage from "./pages/RealmQueryLanguage";
import SchemaVisualizer from './pages/SchemaVisualizer';

export type RealmPluginState = {
  realms: string[],
  selectedRealm: string, 
  objects: Array<Object>,
  schemas: Array<SchemaResponseObject>,
  viewMode: 'data' | 'schemas' | 'RQL',
  query: String,
  queryHistory: Array<String>,
  errorMsg?: String
  queryFavourites: Array<String>,
  selectedSchema: string,
  selectedDataView: 'object' | 'table'
}

export type SchemaResponseObject = {
  name: string;
  embedded: boolean;
  asymmetric: boolean;
  primaryKey: String;
  properties: { [key: string]: SchemaPropertyValue };
};

export type SchemaPropertyValue = {
  name: string;
  indexed: boolean;
  optional: boolean;
  type: string;
  mapTo: string;
};

type Events = {
  getObjects: ObjectsMessage
  getSchemas: SchemaMessage
  liveObjectAdded: AddLiveObjectRequest
  liveObjectDeleted: DeleteLiveObjectRequest
  liveObjectEdited: EditLiveObjectRequest
  getRealms: RealmsMessage;
  executeQuery: QueryResult
};

type Methods = {
  executeQuery: (query: QueryObject) => Promise<Object[]>
  getObjects: (data: SchemaRequest) => Promise<Object[]>
  getSchemas: (data: RealmRequest) => Promise<SchemaResponseObject[]>
  getRealms: () => Promise<string[]>
}

type RealmsMessage = {
  realms: string[];
}

type ObjectsMessage = {
  objects: Array<Object>;
};

type SchemaMessage = {
  schemas: Array<SchemaResponseObject>;
};

type RealmRequest = {
  realm: string;
}

type SchemaRequest = {
  schema: string;
  realm: string;
}

type AddLiveObjectRequest = {
  newObject: Object
}

type DeleteLiveObjectRequest = {
  index: number
}

type EditLiveObjectRequest = {
  newObject: Object
  index: number
}

type QueryObject = {
  schema: string;
  query: String;
  realm: string;
}

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
    schemas: [],
    viewMode: "data",
    query: "",
    queryHistory: [],
    queryFavourites: [],
    selectedSchema: '',
    selectedDataView: 'object',
  });

  client.onMessage("getRealms", (data: RealmsMessage) => {
    const state = pluginState.get();
    pluginState.set({...state, realms: data.realms})
  })

  client.onMessage("getObjects", (data: ObjectsMessage) => {
    console.log("received objects", data.objects);
    const state = pluginState.get();
    pluginState.set({ ...state, objects: data.objects });
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

  client.onMessage('liveObjectAdded', (data: AddLiveObjectRequest) => {
    console.log("live", data)
    const state = pluginState.get();
    const {newObject} = data;
    pluginState.set({...state, objects: [...state.objects, newObject]});
  })

  client.onMessage("liveObjectDeleted", (data: DeleteLiveObjectRequest) => {
    console.log("live", data)
    const state = pluginState.get();
    const newObjects = [...state.objects];
    newObjects.splice(data.index, 1);
    pluginState.set({...state, objects: newObjects});
  })

  client.onMessage("liveObjectEdited", (data: EditLiveObjectRequest) => {
    console.log("live", data)
    const state = pluginState.get();
    const {newObject} = data;
    const newObjects = [...state.objects];
    newObjects.splice(data.index, 1, newObject);
    pluginState.set({...state, objects: newObjects});
  })

  client.addMenuEntry({
    action: "clear",
    handler: async () => {
      // pluginState.set({});
    },
  });

  const getRealms = () => {
    client.send("getRealms", undefined);
  }

  const getObjects = (event: {
    schema: string;
    realm: string;
  }) => {
    console.log("myRealm",event);
    client.send("getObjects", ({schema: event.schema, realm: event.realm}))
  }

  const getSchemas = (realm: string) => {
    client.send("getSchemas", {realm: realm});
  }

  const updateViewMode = (event: { viewMode: "data" | "schemas" | "RQL" }) => {
    pluginState.update((state) => {
      state.viewMode = event.viewMode;
      // state.error = null;
    });
  };

  const executeQuery = () => {
    const history = pluginState.get().queryHistory;
    const query = pluginState.get().query
    if (
      query !== '' && (history.length == 0 ||
      history[history.length - 1] != query)
    ) {
      pluginState.update((st) => {
        if (history.length + 1 > 10) {
          st.queryHistory.shift();
        }
        st.queryHistory = [...st.queryHistory, st.query];
      });
    }
    const state = pluginState.get()
    client.send('executeQuery', {query: state.query, realm: state.selectedRealm, schema: state.selectedSchema});
  }
  const updateSelectedSchema = (event: {schema: string}) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedSchema: event.schema,
    });
  };

  const updateSelectedRealm = (event: {realm: string}) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedRealm: event.realm,
    });
  };

  const updateDataViewMode = (event: {
    viewMode: 'object' | 'table';
  }) => {
    pluginState.update((state) => {
      state.selectedDataView = event.viewMode;
     // state.error = null;
    });
  };


  client.onConnect( async () => {
    await setTimeout(() => {}, 4000)
    getRealms();
  });
  return {state: pluginState, getObjects, getSchemas, updateViewMode, executeQuery, updateSelectedSchema, updateDataViewMode, updateSelectedRealm};
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
    instance.updateViewMode({viewMode: 'data'});
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
        <ViewSelecter></ViewSelecter>
        <Radio.Group value={state.viewMode} onChange={onViewModeChanged}>
          <Radio.Button value="data" onClick={onDataClicked}>
            <TableOutlined style={{ marginRight: 5 }} />
            <Typography.Text>Data</Typography.Text>
          </Radio.Button>
          <Radio.Button onClick={onSchemasClicked} value="schemas">
            <SettingOutlined style={{ marginRight: 5 }} />
            <Typography.Text>Schemas</Typography.Text>
          </Radio.Button>
          <Radio.Button onClick={onRQLClicked} value="RQL">
            <ConsoleSqlOutlined style={{ marginRight: 5 }} />
            <Typography.Text>RQL</Typography.Text>
          </Radio.Button>
        </Radio.Group>
      </Toolbar>
      <RealmSchemaSelect></RealmSchemaSelect>
      {state.viewMode === "data" ? (
        <DataVisualizer
          objects={state.objects}
          schemas = {state.schemas}
          getObjects={instance.getObjects}
          selectedSchema={state.selectedSchema}
         />
      ) : null}
      {state.viewMode === "schemas" ? (
        <SchemaVisualizer schemas={state.schemas}></SchemaVisualizer>
      ) : null}
      {state.viewMode === "RQL" ? (
        <>
          <RealmQueryLanguage instance={instance}></RealmQueryLanguage>
        </>
      ) : null}
    </Layout.ScrollContainer>
  );
}