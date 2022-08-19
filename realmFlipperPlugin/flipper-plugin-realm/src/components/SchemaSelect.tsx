import { Button, Select } from 'antd';
import { styled, Toolbar, usePlugin, useValue } from 'flipper-plugin';
import React, { useCallback } from 'react';
import { SchemaObject } from '../CommonTypes';
import { plugin } from '../index';
import SchemaHistoryActions from './SchemaHistoryActions';

const { Option } = Select;

export const BoldSpan = styled.span({
  fontSize: 12,
  color: '#90949c',
  fontWeight: 'bold',
  textTransform: 'uppercase',
});
type InputType = {
  schemas: SchemaObject[];
}

const SchemaSelect = ({
  schemas,
}: InputType) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  const onSchemaSelected = (selected: string) => {
    let selectedSchemaObject: SchemaObject;
    schemas.forEach((schema) => {
      if (schema.name === selected) {
        selectedSchemaObject = schema;
        return;
      }
    });
    instance.updateSelectedSchema(selectedSchemaObject);
    instance.getObjects();
  };

  const schemaOptions = schemas.map((schema) => (
    <Option key={schema.name} value={schema.name}>
      {schema.name}
    </Option>
  ));


  return (
    <Toolbar position="top">
      <SchemaHistoryActions />
      <BoldSpan>Object type</BoldSpan>
      <Select
        showSearch
        value={state.currentSchema?.name}
        onChange={onSchemaSelected}
        style={{ flex: 1 }}
        dropdownMatchSelectWidth={false}
      >
        {schemaOptions}
      </Select>
      <Button onClick={() => instance.refreshState()} type="default">
        Refresh
      </Button>
    </Toolbar>
  );
};

export default React.memo(SchemaSelect);