import { Pagination } from 'antd';
import { usePlugin, useValue } from 'flipper-plugin';
import React from 'react';
import { plugin } from '..';

const DataPagination = () => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  const getMore = (newSelectedPage: number) => {
    if (newSelectedPage > state.currentPage) {
      instance.getObjectsFoward();
    } else {
      instance.getObjectsBackwards();
    }
    instance.setCurrentPage(newSelectedPage);
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
