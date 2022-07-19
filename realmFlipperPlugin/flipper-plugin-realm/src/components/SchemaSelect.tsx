import {
    Button, Select
} from 'antd';
import {
    Toolbar,styled, usePlugin, useValue, useMemoize
} from 'flipper-plugin';
import React from 'react';
import { useCallback } from 'react';
import {plugin} from '../index';

const {Option} = Select;

const BoldSpan = styled.span({
    fontSize: 12,
    color: '#90949c',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  });

  export default () => {
    const instance = usePlugin(plugin);
    const state = useValue(instance.state);
    
    
    const onSchemaSelected = 
        (selected: string) => {
            instance.getObjects({realm: state.selectedRealm,schema: selected});
          instance.updateSelectedSchema({
            schema: selected,
          });
        },
        [instance],
    );
    state.schemas.map(({name}) => console.log("task",name))
    const tableOptions = state.schemas.map(({name}) => (
        <Option key={name} value={name}>
            {name}
        </Option>
    ))

    return(
<Toolbar position="top">
    <BoldSpan>Realm</BoldSpan>
        <Select
        showSearch
        value={state.selectedRealm}
        onChange={onRealmSelected}
        style={{flex: 1}}
        dropdownMatchSelectWidth={false}>
        {realmOptions}
        </Select>
    <BoldSpan>Schema</BoldSpan>
    <Select
        showSearch
        value={state.selectedSchema}
        onChange={onSchemaSelected}
        style={{flex: 1}}
        dropdownMatchSelectWidth={false}>
        {schemaOptions}
    </Select>
    <Button onClick={() => console.log("REFRESH clicked!")} type="default">
        Refresh
    </Button>
</Toolbar>
    )
}