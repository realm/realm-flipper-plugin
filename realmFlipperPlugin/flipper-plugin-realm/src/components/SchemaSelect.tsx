import {
    Button, Select
} from 'antd';
import {
    Toolbar,styled, usePlugin, useValue, useMemoize
} from 'flipper-plugin';
import React from 'react';
import { useCallback } from 'react';
import {plugin} from '../index';

const BoldSpan = styled.span({
    fontSize: 12,
    color: '#90949c',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  });

  export default () => {    
    const instance = usePlugin(plugin);
    const state = useValue(instance.state);
    const onSchemaSelected = useCallback(
        (selected: string) => {
          instance.updateSelectedSchema({
            schema: selected,
          });
        },
        [instance],
    );
    state.schemas.map(({name}) => console.log("task",name))
    const tableOptions = state.schemas.map(({name}) => (
        <Select key={name} value={name}>
            {name}
        </Select>
    ))
    
    return(
<Toolbar position="top">
    <BoldSpan>Schema</BoldSpan>
    <Select
        showSearch
        value={state.selectedSchema}
        onChange={onSchemaSelected}
        style={{flex: 1}}
        dropdownMatchSelectWidth={false}>
        {tableOptions}
    </Select>
    <Button onClick={() => console.log("REFRESH clicked!")} type="default">
    Refresh
    </Button>
</Toolbar>
    )
}