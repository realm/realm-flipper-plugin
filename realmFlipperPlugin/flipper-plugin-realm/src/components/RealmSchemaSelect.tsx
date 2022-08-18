import { Button, Select } from 'antd';
import { styled, Toolbar, usePlugin, useValue } from 'flipper-plugin';
import React, { useCallback } from 'react';
import { SchemaObject } from '../CommonTypes';
import { plugin } from '../index';

const { Option } = Select;

export const BoldSpan = styled.span({
  fontSize: 12,
  color: '#90949c',
  fontWeight: 'bold',
  textTransform: 'uppercase',
});

const RealmSchemaSelect = (props: {
  schemas: SchemaObject[];
  realms: string[];
}) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const { schemas, realms } = props;

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
    //instance.executeQuery('');
  };

  const schemaOptions = schemas.map((schema) => (
    <Option key={schema.name} value={schema.name}>
      {schema.name}
    </Option>
  ));

  const onRealmSelected = useCallback(
    (selected: string) => {
      instance.getSchemas(selected);
      instance.updateSelectedRealm(selected);
    },
    [instance]
  );
  const realmOptions = realms.map((realm) => (
    <Option key={realm} value={realm}>
      {realm}
    </Option>
  ));

  return (
    <Toolbar position="top">
      <BoldSpan>Realm</BoldSpan>
      <Select
        showSearch
        value={state.selectedRealm}
        onChange={onRealmSelected}
        style={{ width: '30%' }}
        dropdownMatchSelectWidth={false}
      >
        {realmOptions}
      </Select>
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

export default React.memo(RealmSchemaSelect);