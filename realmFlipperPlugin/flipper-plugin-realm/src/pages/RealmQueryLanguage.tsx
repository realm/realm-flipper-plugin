import React, { ReactElement, useEffect, useState } from 'react';
import { StarOutlined } from '@ant-design/icons';
import { Button, Alert, AutoComplete, Row, Col } from 'antd';
import { plugin } from '../index';
import { DataTable, schemaObjToColumns } from '../components/DataTable';
import { usePlugin, useValue, Layout } from 'flipper-plugin';
import { RealmObject, SchemaProperty, SchemaObject } from '../CommonTypes';
type PropsType = {
  schema?: SchemaObject;
  renderOptions?: (
    row: RealmObject,
    schemaProperty: SchemaProperty,
    schema: SchemaObject
  ) => ReactElement;
};

export const RealmQueryLanguage = ({ schema, renderOptions }: PropsType) => {
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const [queryResult, setQueryResult] = useState<Record<string, unknown>[]>([]);
  const [query, setQuery] = useState('');
  const [favourites, setFavourites] = useState<string[]>(JSON.parse(
    localStorage.getItem('favourites') || '{"favourites":[]}'
  ).favourites || []);
    console.log('favs', favourites)
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  queryHistory = JSON.parse(
    localStorage.getItem('history') || '{ "history": [] }'
  ).history;
  if (queryHistory === undefined) {
    queryHistory = [];
  }

  useEffect(() => {
    if (schema) executeQuery('');
  }, [state.selectedRealm, schema]);

  if (!schema) {
    return <>Please select a schema.</>;
  }

  const addToFavorites = () => {
    let favourites2 = favourites;
  
    if (!favourites.includes(query) && query !== '') {
      favourites2 = [...favourites2, query];
    }
    // console.log('setting fabourites to', favourites);
    setFavourites(favourites2);
    localStorage.setItem(
      'favourites',
      JSON.stringify({ favourites: favourites2 })
    );
  };

  const executeQuery = async (query: string) => {
    try {
      const res = await instance.executeQuery(query, schema.name);
      console.log('here', res);
      setErrorMsg(undefined);
      setQueryResult(res);
      return res;
    } catch (e) {
      setErrorMsg(e.message);
      console.log('there', e);

      return e;
    }
  };

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
      <Layout.Container grow style={{ minHeight: '500px' }}>
        <Row>
          <Col flex="auto">
            <AutoComplete
              style={{ width: '100%' }}
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
                  options: favourites
                    .map((val, id) => wrapItem(val, 2 * id + 1))
                    .reverse(),
                },
              ]}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={() => executeQuery(query)}
              title="executeButton"
            >
              Execute
            </Button>
            <Button icon={<StarOutlined />} onClick={addToFavorites}></Button>
          </Col>
        </Row>
        <Layout.ScrollContainer>
          <DataTable
            columns={schemaObjToColumns(schema)}
            objects={queryResult}
            schemas={state.schemas}
            currentSchema={schema}
            // rowSelection={rowSelection}
          />
        </Layout.ScrollContainer>
      </Layout.Container>
    </>
  );
};

// let instance: ReturnType<typeof plugin>;

const wrapItem = (query: string, id: number) => ({
  label: query,
  value: query,
  key: id,
});
let queryHistory: Array<string>;

export const addToHistory = (query: string) => {
  let history = queryHistory;

  if (
    query !== '' &&
    (history.length == 0 || history[history.length - 1] != query)
  ) {
    if (history.length + 1 > 10) {
      history.shift();
    }
    history = [...history, query];
  }

  localStorage.setItem('history', JSON.stringify({ history: history }));
};
