import React, { useState } from 'react';
import { usePlugin, useValue } from "flipper-plugin";
import { plugin } from '..';
import {Pagination} from 'antd';

const DataPagination = () => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  const getMore = (newSelectedPage: number, currentPageSize: number) => {
    if (newSelectedPage > state.currentPage) {
      instance.getObjects({
        schema: state.selectedSchema,
        realm: state.selectedRealm,
        goBack: false,
      });
    } else {
      instance.getObjects({
        schema: state.selectedSchema,
        realm: state.selectedRealm,
        goBack: true,
      });
    }
    instance.setCurrentPage({ currentPage: newSelectedPage });
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

export default React.memo(DataPagination);