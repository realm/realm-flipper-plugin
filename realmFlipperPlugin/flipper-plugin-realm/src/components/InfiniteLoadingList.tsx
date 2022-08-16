import { Table, message, Avatar, Spin, List } from 'antd';
import { usePlugin, useValue } from 'flipper-plugin';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { plugin } from '..';

const InfinityLoadingList = ({ objects, columns, currentSchema }) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  console.log('reload', objects);
  const handleInfiniteOnLoad = () => {
    console.log('more');
    setLoading(true);
    if (state.objects.length >= state.totalObjects) {
      message.warning('Infinite List loaded all');
      return;
    }
    instance.getObjects();
  };

  const handleOnChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, Key[] | null>,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: any
  ) => {
    //TODO: make type of a field
    if (extra.action === 'sort') {
      if (state.sortingColumn !== sorter.field) {
        instance.setSortingDirection('ascend');
        instance.setSortingColumn(sorter.field);
      } else {
        instance.toggleSortDirection();
      }
    }
    instance.getObjects();
    instance.setCurrentPage(1);
  };

  const [loading, setLoading] = useState(false);
  return (
    <div
      style={{
        borderRadius: ' 4px',
        overflow: 'auto',
        height: '1000px',
      }}
    >
      <InfiniteScroll
        initialLoad={false}
        pageStart={0}
        loadMore={handleInfiniteOnLoad}
        hasMore={!state.loading && state.hasMore}
        useWindow={false}
        loader={
          <div className="loader" key={0}>
            Loading ...
          </div>
        }
      >
        <Table
          dataSource={objects}
          columns={columns}
          rowKey={(record) => {
            return record[currentSchema.primaryKey];
          }}
          scroll={{ scrollToFirstRowOnChange: false }}
          //onChange={handleOnChange}
          pagination={false}
          //loading={state.loading}
        />
      </InfiniteScroll>
    </div>
  );
};

export default React.memo(InfinityLoadingList);
