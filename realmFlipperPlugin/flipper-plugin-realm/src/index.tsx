import {
  ConsoleSqlOutlined,
  DatabaseOutlined, HistoryOutlined,
  SettingOutlined, TableOutlined
} from '@ant-design/icons';
import { Button, Radio, Typography, RadioChangeEvent, Input, Alert, Select } from 'antd';
const { Option } = Select;
import { createState, Layout, PluginClient, Toolbar, usePlugin, useValue } from 'flipper-plugin';
import React, { useState } from 'react';
import {useCallback} from 'react';
type RealmPluginState = {
  database: Number, 
  objects: Array<Object>,
  schemas: Array<Object>,
  viewMode: 'data' | 'schemas' | 'RQL',
  query: string,
  queryHistory: Array<String>,
  errorMsg?: string
}

type Events = {
  // newData: Data;
  getObjects: ObjectsMessage
  getSchemas: SchemaMessage
  executeQuery: QueryResult
};

type Methods = {
  getObjects: (data: SchemaType) => Promise<Object[]>
  getSchemas: () => Promise<Object[]>
  executeQuery: (query: QueryObject) => Promise<Object[]>
}

type ObjectsMessage = {
  objects: Array<Object>
}

type SchemaMessage = {
  schemas: Array<Object>
}

type SchemaType = {
  schema: String;
}

type QueryObject = {
  query: String;
}

type QueryResult = {
  result: Array<Object> | string
}

// Read more: https://fbflipper.com/docs/tutorial/js-custom#creating-a-first-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#pluginclient
export function plugin(client: PluginClient<Events, Methods>) {
  const pluginState = createState<RealmPluginState>({
    database: 0,
    objects: [],
    schemas: [],
    viewMode: 'data',
    query: '',
    queryHistory: []
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

  client.onMessage('executeQuery', (data: QueryResult) => {
    const state = pluginState.get()
    if (typeof data.result === 'string') {
      console.log("query failed", data.result)
      pluginState.set({...state, errorMsg: data.result})
    }
    else {
      console.log("query succeeded", data.result)
      pluginState.set({...state, objects: data.result, errorMsg: undefined})
    }
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

  const executeQuery = () => {
    pluginState.update(st => {
      st.queryHistory = [...st.queryHistory, st.query]
    })
    const state = pluginState.get()
    // state.queryHistory.push(state.query)
    client.send('executeQuery', {query: state.query})
  }
  return {state: pluginState, getObjects, getSchemas, updateViewMode, executeQuery};
}

// Read more: https://fbflipper.com/docs/tutorial/js-custom#building-a-user-interface-for-the-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#react-hooks
export function Component() {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  // console.log(state.schemas)


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


  const onTextChange = (event: any) => {
    instance.state.update(st => {
      if (event.target) {
        st.query = event.target.value
      }
    })
  }

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
            <div>schemas tab</div>
      : null} 
      {state.viewMode === 'RQL' ? (<>
        <Input.Group compact>
          <Input  style={{ width: 'calc(100% - 200px)' }} 
            placeholder="Enter a query to filter the data"
            onChange={(onTextChange)} id="msgbox"
            onPressEnter={instance.executeQuery}
            allowClear
            />
          <Button type="primary" onClick={instance.executeQuery} title="executeButton">Execute</Button>
        </Input.Group>
        <Input.Group>
          <Select style={{width: '100%'}}>
            {state.queryHistory.map(query => <Option key={query} value={query}>{query}</Option>)}
          </Select>
        </Input.Group>
      {state.errorMsg ? (
        <Alert
          message="Error"
          description={state.errorMsg}
          type="error"
          showIcon
          banner={true}
      />): null}
      </>
      ) : null}
    </Layout.Container>
    
  );
}
