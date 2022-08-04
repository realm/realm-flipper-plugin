import React, { useState } from "react";
import { StarOutlined } from "@ant-design/icons";
import { Button, Input, Alert, AutoComplete } from "antd";
import { plugin, SchemaResponseObject } from '../index';
import { DataTable, schemaObjToColumns } from '../components/DataTable';
import { usePlugin, useValue } from 'flipper-plugin';

type PropsType = {
  schemas: SchemaResponseObject[];
  selectedSchema: string;
  errorMsg?: string;
  executeQuery: (query: string) => void;
  objects: Record<string, unknown>[];
};

export const RealmQueryLanguage = ({
  schemas,
  selectedSchema,
  errorMsg,
  executeQuery,
  objects,
}: PropsType) => {
  const [query, setQuery] = useState('');

  queryFavourites = JSON.parse(
    localStorage.getItem('favourites') || '{"favourites":[]}'
  ).favourites;
  queryHistory = JSON.parse(
    localStorage.getItem('history') || '{ "history": [] }'
  ).history;
  if (queryHistory === undefined) {
    queryHistory = [];
  }
  console.log('queryHistory: ', queryHistory);
  console.log('queryFavourites', queryFavourites);
  const currentSchema = schemas.find(
    (schema) => schema.name === selectedSchema
  );

  if (!currentSchema) {
    return <>Please select a schema.</>;
  }

  const onTextChange = (event: string) => {
    setQuery(event);
  };

  return (
    <>
      {errorMsg ? (
        <Alert
          message="Error"
          description={errorMsg}
          type="error"
          showIcon
          banner
        />
      ) : null}
      <Input.Group compact>
        <AutoComplete
          style={{ width: 'calc(100% - 115px)' }}
          placeholder="Enter a query to filter the data"
          onSearch={onTextChange}
          id="msgbox"
          onChange={onTextChange}
          onKeyUp={(ev) => {
            if (ev.key == 'Enter') executeQuery(query);
          }}
          allowClear
          showSearch
          options={[
            {
              label: 'History',
              options: queryHistory
                .map((val, id) => wrapItem(val, 2 * id))
                .reverse(),
            },
            {
              label: 'Favourites',
              options: queryFavourites
                .map((val, id) => wrapItem(val, 2 * id + 1))
                .reverse(),
            },
          ]}
          backfill={true}
        ></AutoComplete>
        <Button
          type="primary"
          onClick={() => executeQuery(query)}
          title="executeButton"
        >
          Execute
        </Button>
        <Button icon={<StarOutlined />} onClick={addToFavorites}></Button>
      </Input.Group>
      <DataTable
        columns={schemaObjToColumns(currentSchema)}
        objects={objects}
        schemas={schemas}
        selectedSchema={selectedSchema}
        renderOptions={() => <></>}
      />
    </>
  );
};

// let instance: ReturnType<typeof plugin>;

const wrapItem = (query: string, id: number) => ({
  label: query,
  value: query,
  key: id,
});
let queryFavourites: Array<string>, queryHistory: Array<string>;

const addToFavorites = () => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  if (!queryFavourites.includes(state.query) && state.query !== '') {
    queryFavourites = [...queryFavourites, state.query];
  }
  localStorage.setItem(
    'favourites',
    JSON.stringify({ favourites: queryFavourites })
  );
};

export const addToHistory = (query: string) => {
  let history = queryHistory;

  if (
    query !== "" &&
    (history.length == 0 || history[history.length - 1] != query)
  ) {
    if (history.length + 1 > 10) {
      history.shift();
    }
    history = [...history, query];
  }

  localStorage.setItem("history", JSON.stringify({ history: history }));
};