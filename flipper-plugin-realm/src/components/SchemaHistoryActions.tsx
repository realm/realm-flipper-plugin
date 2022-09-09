import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { usePlugin, useValue } from 'flipper-plugin';
import React, { useCallback } from 'react';
import { plugin } from '..';

const SchemaHistoryActions = () => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const goBack = useCallback(() => {
    const newSelectedSchema = state.schemaHistory[state.schemaHistoryIndex - 1];
    if (!newSelectedSchema) {
      return;
    }
    instance.goBackSchemaHistory(newSelectedSchema);
    instance.getObjects();
  }, [state.currentSchema]);

  const goForward = useCallback(() => {
    const newSelectedSchema = state.schemaHistory[state.schemaHistoryIndex + 1];
    if (!newSelectedSchema) {
      return;
    }
    instance.goForwardSchemaHistory(newSelectedSchema);
    instance.getObjects();
  }, [state.currentSchema]);
  return (
    <span
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '5px',
        padding: '5px',
      }}
    >
      <Button
        disabled={
          !state.realms.length ||
          !state.schemas.length ||
          !state.currentSchema ||
          state.schemaHistoryIndex === 0
        }
        value="table"
        onClick={goBack}
      >
        <ArrowLeftOutlined style={{ marginRight: 5 }} />
      </Button>
      <Button
        disabled={
          !state.realms.length ||
          !state.schemas.length ||
          !state.currentSchema ||
          state.schemaHistoryIndex === state.schemaHistory.length - 1
        }
        onClick={goForward}
        value="object"
      >
        <ArrowRightOutlined style={{ marginRight: 5 }} />
      </Button>
    </span>
  );
};
export default React.memo(SchemaHistoryActions);
