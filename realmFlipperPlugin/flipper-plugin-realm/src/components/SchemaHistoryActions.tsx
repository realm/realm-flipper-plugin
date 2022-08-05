import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import React from "react";
import { Button } from 'antd';
import { usePlugin, useValue } from 'flipper-plugin';
import { useCallback } from 'react';
import { plugin } from '..';

const SchemaHistoryActions = () => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const goBack = useCallback(() => {
    const newSelectedSchema = state.schemaHistory[state.schemaHistoryIndex - 1];
    if (!newSelectedSchema) {
      return;
    }
    instance.getObjectsFoward({ realm: null, schema: null });
    instance.goBackSchemaHistory({ schema: newSelectedSchema });
  }, [state.selectedSchema]);

  const goForward = useCallback(() => {
    const newSelectedSchema = state.schemaHistory[state.schemaHistoryIndex + 1];
    if (!newSelectedSchema) {
      return;
    }
    instance.getObjectsFoward({ realm: null, schema: null });
    instance.goForwardSchemaHistory({ schema: newSelectedSchema });
  }, [state.selectedSchema]);
  return (
    <span style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
      <Button
        disabled={
          !state.realms.length ||
          !state.schemas.length ||
          state.selectedSchema === '' ||
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
          state.selectedSchema === '' ||
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