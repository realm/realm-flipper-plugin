import { Layout, usePlugin, useValue } from 'flipper-plugin';
import React from 'react';
import { plugin } from '..';
import DataPagination from './DataPagination';
import PageSizeSelect from './PageSizeSelect';

const PaginationGroup = () => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);


  if (!state.objects.length) {
    return <div></div>;
  }

  return (
    <Layout.Horizontal
      style={{
        paddingBottom: 10,
        paddingTop: 15,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <DataPagination
        totalObjects={state.totalObjects}
        selectedPageSize={state.selectedPageSize}
        currentPage={state.currentPage}
        getObjectsBackwards={instance.getObjectsBackwards}
        getObjectsForward={instance.getObjectsForward}
        setCurrentPage={instance.setCurrentPage}
      />
      <PageSizeSelect
        updateSelectedPageSize={instance.updateSelectedPageSize}
        getObjectsForward={instance.getObjectsForward}
        setCurrentPage={instance.setCurrentPage}
        selectedPageSize={state.selectedPageSize}
      />
    </Layout.Horizontal>
  );
};

export default PaginationGroup;
