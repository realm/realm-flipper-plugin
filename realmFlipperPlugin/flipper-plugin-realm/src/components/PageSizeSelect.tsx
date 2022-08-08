import React from 'react';
import {Select} from 'antd';
import { usePlugin, useValue } from 'flipper-plugin';
import { plugin } from '../index';

const { Option } = Select;

const PageSizeSelect = () => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  const onPageSizeSelect = (
    selected: 10 | 25 | 50 | 75 | 100 | 1000 | 2500
  ) => {
    instance.updateSelectedPageSize(selected);
    instance.getObjectsFoward();
    instance.setCurrentPage(1);
  };

  return (
    <Select
      defaultValue={100}
      style={{
        width: 120,
        marginLeft: 20,
      }}
      onChange={onPageSizeSelect}
      value={state.selectedPageSize}
    >
      <Option value={10}>10</Option>
      <Option value={25}>25</Option>
      <Option value={50}>50</Option>
      <Option value={75}>75</Option>
      <Option value={100}>100</Option>
      <Option value={1000}>1000</Option>
      <Option value={2500}>2500</Option>
    </Select>
  );
};

export default React.memo(PageSizeSelect);