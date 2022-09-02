import { shell } from 'electron';
import { QuestionOutlined, StarOutlined } from '@ant-design/icons';
import { Alert, AutoComplete, Button, Checkbox, Col, Row } from 'antd';
import React, { useState } from 'react';
import { usePlugin } from 'flipper-plugin';
import { plugin } from '..';

type InputType = {
  execute: (query: string) => undefined | 'string';
};

const wrapItem = (query: string, id: number) => ({
  label: query,
  value: query,
  key: id,
});

export const RealmQueryInput = ({ execute }: InputType) => {
  const { state } = usePlugin(plugin);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const executeQuery = () => {
    execute(query);
  };
  queryHistory = JSON.parse(
    localStorage.getItem('history') || '{ "history": [] }'
  ).history;
  const favourites = ['fav1'];
  return (
    <>
      {state.get().errorMessage ? (
        <Alert
          style={{ marginTop: 6, marginBottom: 8 }}
          message="Error"
          description={state.get().errorMessage}
          type="error"
          showIcon
          banner
          closable
          onClose={() => {
            state.get().errorMessage = '';
          }}
        />
      ) : null}
      <Row style={{ padding: 10 }} gutter={[2, 0]} align="middle">
        <Col>
          <Checkbox
            defaultChecked
            onChange={() => setShowSuggestions((v) => !v)}
          >
            Query History
          </Checkbox>
        </Col>
        <Col>
          <Button
            icon={<StarOutlined />}
            onClick={() => {
              return;
            }}
          ></Button>
        </Col>
        <Col flex="auto">
          <AutoComplete
            style={{ width: '100%' }}
            placeholder="Enter a query to filter the data"
            onSearch={setQuery}
            onChange={setQuery}
            onKeyUp={(ev) => {
              if (ev.key == 'Enter') executeQuery();
            }}
            allowClear
            showSearch
            options={
              showSuggestions
                ? [
                    {
                      label: 'History',
                      options: queryHistory
                        .map((val, id) => wrapItem(val, 2 * id))
                        .filter((suggestion) =>
                          suggestion.value.startsWith(query)
                        )
                        .reverse(),
                    },
                    {
                      label: 'Favourites',
                      options: favourites
                        .map((val, id) => wrapItem(val, 2 * id + 1))
                        .reverse(),
                    },
                  ]
                : undefined
            }
          />
        </Col>
        <Col>
          <Button
            onClick={() => {
              const url =
                'https://www.mongodb.com/docs/realm/realm-query-language/';
              shell.openExternal(url);
            }}
            icon={<QuestionOutlined />}
          />
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={() => executeQuery()}
            title="executeButton"
          >
            Execute
          </Button>
        </Col>
      </Row>
    </>
  );
};

let queryHistory: Array<string> = [];

export const addToHistory = (query: string) => {
  if (
    query !== '' &&
    (queryHistory.length == 0 || queryHistory[queryHistory.length - 1] != query)
  ) {
    if (queryHistory.length + 1 > 10) {
      queryHistory.shift();
    }
    queryHistory = [...queryHistory, query];
  }

  localStorage.setItem('history', JSON.stringify({ history: queryHistory }));
};
