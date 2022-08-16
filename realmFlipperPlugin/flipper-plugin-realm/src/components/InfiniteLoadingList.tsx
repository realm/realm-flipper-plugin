import { Table, message, Avatar, Spin, List } from 'antd';
import { usePlugin, useValue } from 'flipper-plugin';
import React from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { plugin } from '..';

const InfinityLoadingList = ({ objects, columns }) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  console.log("reload")
  const handleInfiniteOnLoad = () => {
    console.log('more');
    if (state.objects.length > state.totalObjects) {
      message.warning('Infinite List loaded all');
      return;
    }
    instance.getObjects();
  };

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
