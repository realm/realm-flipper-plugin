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
type RealmPluginState = {
  database: Number, 
  objects: Array<Object>,
  schemas: Array<SchemaResponseObject>,
  viewMode: 'data' | 'schemas' | 'RQL'
}

export type SchemaResponseObject = {
  name: String,
  embedded: boolean,
  assymetric: boolean,
  primaryKey: String,
  properties: Array<Object>
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
    viewMode: 'data'
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

  return {state: pluginState, getObjects, getSchemas, updateViewMode};
}

// Read more: https://fbflipper.com/docs/tutorial/js-custom#building-a-user-interface-for-the-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#react-hooks
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
