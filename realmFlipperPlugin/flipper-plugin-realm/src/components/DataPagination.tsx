import React, { useState } from 'react';
import { usePlugin, useValue } from "flipper-plugin";
import { plugin } from '..';
import {Pagination} from 'antd';
export default (data) => {
      // Custom pagination component
    const instance = usePlugin(plugin);
    const state = useValue(instance.state);
    const [current, setCurrent] = useState(1);
    
    return (
      <Pagination
        onChange={setCurrent}
        total={data.length}
        current={current}
        pageSize={state.selectedPageSize}
      />
    );
};