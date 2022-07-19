import React from "react";
import { StarOutlined } from '@ant-design/icons';
import { Button, Input, Alert, AutoComplete } from 'antd';
import { useValue, Layout } from 'flipper-plugin';
import { RealmPluginState, plugin } from '../index'
import DataVisualizer from "./DataVisualizer";

let instance: ReturnType<typeof plugin>
const onTextChange = (event: String) => {
    instance.state.update(st => {
      st.query = event
    })
}

const wrapItem = (query: String, id: number) => (
    {
        label: query,
        value: query,
        key: id
    }
);

const onStar = () => {
    const state = instance.state.get()
    if (!state.queryFavourites.includes(state.query) && state.query !== '') {
      instance.state.update(st => {
        st.queryFavourites = [...st.queryFavourites, st.query]
      })
    }
}
export default (props: { instance: ReturnType<typeof plugin> }) => {
    instance = props.instance
    const state: RealmPluginState = useValue(instance.state);
    return (<>
        {state.errorMsg ? (
            <Alert
              message="Error"
              description={state.errorMsg}
              type="error"
              showIcon
              banner
          />): null}
        <Input.Group compact>
          <AutoComplete style={{ width: 'calc(100% - 115px)' }} 
            placeholder="Enter a query to filter the data"
            onSearch={onTextChange} id="msgbox"
            onChange={onTextChange}
            onKeyUp={(ev) => {
              if (ev.key == 'Enter')
                instance.executeQuery()
            }}
            allowClear
            showSearch
            options={[{
              label: 'History',
              options: state.queryHistory.map((val, id) => wrapItem(val, 2 * id)).reverse()
            },
            {
              label: 'Favourites',
              options: state.queryFavourites.map((val, id) => wrapItem(val, 2 * id + 1)).reverse()
            }]}
            backfill={true}
            >
          </AutoComplete>
          <Button type="primary" onClick={instance.executeQuery} title="executeButton">Execute</Button>
          <Button icon={<StarOutlined />} onClick={onStar}></Button>
        </Input.Group>
      <DataVisualizer objects = {state.objects} schemas = {state.schemas} getObjects={instance.getObjects} selectedSchema={state.selectedSchema}/>
      </>
    )
}