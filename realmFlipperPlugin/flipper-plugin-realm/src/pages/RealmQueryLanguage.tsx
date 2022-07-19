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
let queryFavourites: Array<String>, queryHistory: Array<String>;

const addToFavorites = () => {
    const state = instance.state.get()
    console.log("includes: ", queryFavourites.includes(state.query), state.query)
    if (!queryFavourites.includes(state.query) && state.query !== '') {
      queryFavourites = [...queryFavourites, state.query]
    }
    console.log("after:", queryFavourites)
    localStorage.setItem('favourites', JSON.stringify({ favourites: queryFavourites }))
}

export const addToHistory = (query: String) => {
  // const historyObj = JSON.parse(localStorage.getItem('history') || "{ history: [] }");
  let history = queryHistory

  if (
    query !== '' && (history.length == 0 ||
    history[history.length - 1] != query)
  ) {
    if (history.length + 1 > 10) {
      history.shift();
    }
    history = [...history, query]
  }
  
  localStorage.setItem('history', JSON.stringify({ history: history }))
};

export const RealmQueryLanguage = (props: { instance: ReturnType<typeof plugin> }) => {
  console.log('fav:', localStorage.getItem('favourites'))
    queryFavourites = JSON.parse(localStorage.getItem('favourites') || '{"favourites":[]}').favourites;
    queryHistory = JSON.parse(localStorage.getItem('history') || '{ "history": [] }').history;
    
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
              options: queryHistory.map((val, id) => wrapItem(val, 2 * id)).reverse()
            },
            {
              label: 'Favourites',
              options: queryFavourites.map((val, id) => wrapItem(val, 2 * id + 1)).reverse()
            }]}
            backfill={true}
            >
          </AutoComplete>
          <Button type="primary" onClick={instance.executeQuery} title="executeButton">Execute</Button>
          <Button icon={<StarOutlined />} onClick={addToFavorites}></Button>
        </Input.Group>
      <DataVisualizer objects = {state.objects} schemas = {state.schemas} getObjects={instance.getObjects} selectedSchema={state.selectedSchema}/>
      </>
    )
}