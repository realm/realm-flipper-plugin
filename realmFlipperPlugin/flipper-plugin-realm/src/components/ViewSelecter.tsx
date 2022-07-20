import { AlignLeftOutlined, TableOutlined } from '@ant-design/icons';
import React from "react";
import { Radio, RadioChangeEvent } from 'antd';
import { usePlugin, useValue } from 'flipper-plugin';
import { useCallback } from 'react';
import { plugin } from '..';

export default () => {
    const instance = usePlugin(plugin);
    const state = useValue(instance.state);

    const onDataViewModeChanged = useCallback(
        (evt: RadioChangeEvent) => {
          instance.updateDataViewMode({viewMode: evt.target.value ?? 'table'});
        },
        [instance],
      );
    
      const onTableClicked = useCallback(() => {
        instance.updateDataViewMode({viewMode: 'table'});
      }, [instance]);
    
      const onObjectClicked = useCallback(() => {
        instance.updateDataViewMode({viewMode: 'object'});
      }, [instance]);
    return(
        <span style={{position: "absolute", top: 80, right: 0, zIndex: 1}}>
            <Radio.Group value={state.selectedDataView} onChange={onDataViewModeChanged}>
            <Radio.Button value="table" onClick={onTableClicked}>
                <TableOutlined style={{marginRight: 5}} />
            </Radio.Button>
            <Radio.Button onClick={onObjectClicked} value="object">
                <AlignLeftOutlined style={{marginRight: 5}} />
            </Radio.Button>
            </Radio.Group>
        </span>
    )
}