import React, { useState } from 'react';
import { usePlugin, useValue } from "flipper-plugin";
import { plugin } from '..';
import {Pagination} from 'antd';

export default () => {
    const instance = usePlugin(plugin);
    const state = useValue(instance.state);
    
  const getMore = () => {
    instance.setCurrentPage({currentPage: state.currentPage+1});
    instance.getObjects({schema: state.selectedSchema, realm: state.selectedRealm})
  }
  console.log(state.totalObjects)
    return (
      <Pagination
        onChange={getMore}
        total={state.totalObjects}
        current={state.currentPage}
        pageSize={state.selectedPageSize}
        showSizeChanger = {false}
      />
    );
};