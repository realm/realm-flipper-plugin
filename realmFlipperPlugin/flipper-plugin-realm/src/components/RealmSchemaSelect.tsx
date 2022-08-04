import { Button, Select } from 'antd';
import { styled, Toolbar, usePlugin, useValue } from 'flipper-plugin';
import React, { useCallback } from 'react';
import { plugin } from '../index';

const { Option } = Select;

export const BoldSpan = styled.span({
  fontSize: 12,
  color: '#90949c',
  fontWeight: 'bold',
  textTransform: 'uppercase',
});

const RealmSchemaSelect = () => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  const onSchemaSelected = (selected: string) => {
    instance.updateSelectedSchema({
      schema: selected,
    });
    instance.getObjectsFoward({ realm: null, schema: null });
    instance.executeQuery('');
  };
  const schemaOptions = state.schemas.map(({ name }) => (
    <Option key={name} value={name}>
      {name}
    </Option>
  ));

  const onRealmSelected = useCallback(
    (selected: string) => {
      instance.getSchemas(selected);
      instance.updateSelectedRealm({
        realm: selected,
      });
    },
    [instance]
  );
  const realmOptions = state.realms.map((name) => (
    <Option key={name} value={name}>
      {name}
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
        value={state.selectedSchema}
        onChange={onSchemaSelected}
        style={{ flex: 1 }}
        dropdownMatchSelectWidth={false}
      >
        {schemaOptions}
      </Select>
      <Button onClick={() => console.log('REFRESH clicked!')} type="default">
        Refresh
      </Button>
    </Toolbar>
  );
};

export default React.memo(RealmSchemaSelect);