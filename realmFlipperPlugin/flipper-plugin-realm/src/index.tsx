import React from 'react';
import {PluginClient, usePlugin, createState, useValue, Layout } from 'flipper-plugin';
import { Button } from 'antd';

type RealmPluginState = {
  database: Number, 
  objects: Array<Object>,
  schemas: Array<Object>,
}

type Events = {
  // newData: Data;
  getObjects: ObjectsMessage
};

type Methods = {
  getObjects: (data: SchemaType) => Promise<Object[]>
}

type ObjectsMessage = {
  objects: Array<Object>
}

type SchemaType = {
  schema: String;
}

// Read more: https://fbflipper.com/docs/tutorial/js-custom#creating-a-first-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#pluginclient
export function plugin(client: PluginClient<Events, Methods>) {
  const pluginState = createState<RealmPluginState>({
    database: 0,
    objects: [],
    schemas: []
  });

  client.onMessage("getObjects", (data: ObjectsMessage) => {
    console.log("received objects",data.objects)
    const state = pluginState.get()
    pluginState.set({...state, objects: data.objects})
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

  return {state: pluginState, getObjects};
}

// Read more: https://fbflipper.com/docs/tutorial/js-custom#building-a-user-interface-for-the-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#react-hooks
export function Component() {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  console.log(state.objects)

  return (
    <Layout.ScrollContainer>
<Button onClick = {() => instance.getObjects()} title="Get Objects" >button</Button>
      {state.objects.map((obj) => {
        // @ts-ignore
        return (<div key={ obj._id}>{JSON.stringify(obj)}</div>)
      })}
    </Layout.ScrollContainer>
    
  );
}
