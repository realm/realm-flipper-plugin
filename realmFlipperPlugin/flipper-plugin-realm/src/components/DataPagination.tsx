import React, { useState } from 'react';
import { usePlugin, useValue } from "flipper-plugin";
import { plugin } from '..';
import {Pagination} from 'antd';

const DataPagination = () => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  const getMore = (newSelectedPage: number, currentPageSize: number) => {
    if (newSelectedPage > state.currentPage) {
      instance.getObjectsFoward({
        schema: state.selectedSchema,
        realm: state.selectedRealm,
      });
    } else {
      instance.getObjectsBackwards({
        schema: state.selectedSchema,
        realm: state.selectedRealm,
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