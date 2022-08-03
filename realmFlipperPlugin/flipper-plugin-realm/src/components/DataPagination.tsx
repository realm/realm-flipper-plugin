import React, { useState } from 'react';
import { usePlugin, useValue } from "flipper-plugin";
import { plugin } from '..';
import {Pagination} from 'antd';

export default () => {
    const instance = usePlugin(plugin);
    const state = useValue(instance.state);
    
  const getMore = (newSelectedPage: number, currentPageSize: number) => {
    instance.setCurrentPage({ currentPage: newSelectedPage });
    instance.getObjects({
      schema: state.selectedSchema,
      realm: state.selectedRealm,
    });
  };
  return (
    <Pagination
      onChange={getMore}
      total={state.totalObjects}
      current={state.currentPage}
      pageSize={state.selectedPageSize}
      showSizeChanger={false}
      simple={true}
      hideOnSinglePage={true}
    />
  );
};