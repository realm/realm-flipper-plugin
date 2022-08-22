import { Table, message, Avatar, Spin, List } from 'antd';
import { Spinner, usePlugin, useValue } from 'flipper-plugin';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { plugin } from '..';

const InfinityLoadingList = ({ objects, columns, currentSchema }) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const handleInfiniteOnLoad = () => {
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

  const [loading, setLoading] = useState(true);
  return (
    <div
      style={{
        overflow: 'auto',
        height: '100%',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <InfiniteScroll
        initialLoad={false}
        pageStart={0}
        loadMore={handleInfiniteOnLoad}
        hasMore={!state.loading && state.hasMore}
        useWindow={false}
        loader={
          <div
            style={{
              marginTop: '25px',
              marginBottom: '25px',
              display: 'inline-block',
            }}
            key={0}
          >
            <Spinner size={30}></Spinner>
          </div>
        }
      >
        <Table
          bordered={true}

          dataSource={objects}
          columns={columns}
          rowKey={(record) => {
            return record[currentSchema.primaryKey];
          }}
          scroll={{ scrollToFirstRowOnChange: false }}
          onChange={handleOnChange}
          pagination={false}
        />
      </InfiniteScroll>
    </div>
  );
};

export default React.memo(InfinityLoadingList);
