import {
  ConsoleSqlOutlined,
  DatabaseOutlined, HistoryOutlined,
  SettingOutlined, TableOutlined
} from '@ant-design/icons';
import { Button, Radio, Typography, RadioChangeEvent } from 'antd';
import { createState, Layout, PluginClient, Toolbar, usePlugin, useValue } from 'flipper-plugin';
import React from 'react';
import {useCallback} from 'react';
import SchemaVisualizer from './pages/SchemaVisualizer';
import SchemaSelect from './components/SchemaSelect'

type RealmPluginState = {
  database: Number, 
  objects: Array<Object>,
  schemas: Array<SchemaResponseObject>,
  viewMode: 'data' | 'schemas' | 'RQL',
  selectedSchema: string
}

export type SchemaResponseObject = {
  name: string,
  embedded: boolean,
  asymmetric: boolean,
  primaryKey: String,
  properties: {[key: string]: SchemaPropertyValue}
}

export type SchemaPropertyValue = {
  name: string,
  indexed: boolean,
  optional: boolean,
  type:string,
  mapTo: string
}

type Events = {
  // newData: Data;
  getObjects: ObjectsMessage
  getSchemas: SchemaMessage
};

type Methods = {
  getObjects: (data: SchemaRequest) => Promise<Object[]>
  getSchemas: () => Promise<SchemaResponseObject[]>
}

type ObjectsMessage = {
  objects: Array<Object>
}

type SchemaMessage = {
  schemas: Array<SchemaResponseObject>
}

type SchemaRequest = {
  schema: String;
}

// Read more: https://fbflipper.com/docs/tutorial/js-custom#creating-a-first-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#pluginclient
export function plugin(client: PluginClient<Events, Methods>) {
  const pluginState = createState<RealmPluginState>({
    database: 0,
    objects: [],
    schemas: [],
    viewMode: 'data',
    selectedSchema: ''
  });

  client.onMessage("getObjects", (data: ObjectsMessage) => {
    console.log("received objects",data.objects)
    const state = pluginState.get()
    pluginState.set({...state, objects: data.objects})
  })

  client.onMessage('getSchemas', (data: SchemaMessage) => {
    console.log("received schemas",data.schemas)
    const state = pluginState.get()
    pluginState.set({...state, schemas: data.schemas})
  })

  client.onMessage("liveObjectAdded", (data: any) => {
    console.log("received object",data);
    const state = pluginState.get()
    const newObject = data.objects[data.index];
    pluginState.set({...state, objects: [...state.objects, newObject]})
  })

  client.onMessage("liveObjectDeleted", (data: any) => {
    console.log("received object",data);
    const state = pluginState.get()
    pluginState.set({...state, objects: [...state.objects.splice(data.index, 1)]})
  })

  client.onMessage("liveObjectEdited", (data: any) => {
    console.log("received object",data);
    const state = pluginState.get()
    const updatedObject = data.objects[data.index];
    
    pluginState.set({...state, objects: [...state.objects, data.objects[data.index]]})
  })

  client.addMenuEntry({
    action: 'clear',
    handler: async () => {
     // pluginState.set({});
    },
  });

  const getObjects = () => {
    client.send("getObjects", ({schema: 'Task'}))
  }

  const getSchemas = () => {
    client.send("getSchemas", undefined);
  }

  const updateViewMode = (event: {
    viewMode: 'data' | 'schemas' | 'RQL';
  }) => {
    pluginState.update((state) => {
      state.viewMode = event.viewMode;
     // state.error = null;
    });
  };

  const updateSelectedSchema = (event: {schema: string}) => {
    const state = pluginState.get();
    pluginState.set({
      ...state,
      selectedSchema: event.schema,
    });
  };

  return {state: pluginState, getObjects, getSchemas, updateViewMode, updateSelectedSchema};
}

export function Component() {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  console.log(state.schemas)


  const onViewModeChanged = useCallback(
    (evt: RadioChangeEvent) => {
      instance.updateViewMode({viewMode: evt.target.value ?? 'data'});
    },
    [instance],
  );

  const onDataClicked = useCallback(() => {
    instance.updateViewMode({viewMode: 'data'});
  }, [instance]);

  const onSchemasClicked = useCallback(() => {
    instance.updateViewMode({viewMode: 'schemas'});
  }, [instance]);

  const onRQLClicked = useCallback(() => {
    instance.updateViewMode({viewMode: 'RQL'});
  }, [instance]);


  console.log(state.viewMode)

  return (
    <Layout.Container grow>
      <Toolbar position="top">
        <Radio.Group value={state.viewMode} onChange={onViewModeChanged}>
          <Radio.Button value="data" onClick={onDataClicked}>
            <TableOutlined style={{marginRight: 5}} />
            <Typography.Text>Data</Typography.Text>
          </Radio.Button>
          <Radio.Button onClick={onSchemasClicked} value="schemas">
            <SettingOutlined style={{marginRight: 5}} />
            <Typography.Text>Schemas</Typography.Text>
          </Radio.Button>
          <Radio.Button onClick={onRQLClicked} value="RQL">
            <ConsoleSqlOutlined style={{marginRight: 5}} />
            <Typography.Text>RQL</Typography.Text>
          </Radio.Button>
        </Radio.Group>
      </Toolbar>
      <SchemaSelect></SchemaSelect>
     {state.viewMode === 'data' ? (
      <div>
        <Button onClick = {() => instance.getObjects()} title="Get Objects" >button</Button>
        <Button onClick = {() => instance.getSchemas()} title="Get Objects" >get schemas</Button>
              {state.objects.map((obj) => {
                // @ts-ignore
                return (<div key={ obj._id}>{JSON.stringify(obj)}</div>)
              })}
              <div>SCHEMAS</div>
              {state.schemas.map((schema) => {
                // @ts-ignore
                return (<div key={ schema.name}>{JSON.stringify(schema)}</div>)
              })}
      </div>
      ) : null} 
      {state.viewMode === 'schemas' ?
            <SchemaVisualizer schemas={state.schemas}></SchemaVisualizer>
      : null}
      {state.viewMode === 'RQL' ?
              <div>RQL tab</div>
      : null}
    </Layout.Container>
  );
}