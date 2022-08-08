import { Select } from 'antd';
import React from 'react';

const { Option } = Select;

const PageSizeSelect = (props: {
  updateSelectedPageSize: (
    pageSize: 10 | 25 | 50 | 75 | 100 | 1000 | 2500
  ) => void;
  getObjectsForward: () => void;
  setCurrentPage: (pageSize: number) => void;
  selectedPageSize: 10 | 25 | 50 | 75 | 100 | 1000 | 2500;
}) => {
  const onPageSizeSelect = (
    selected: 10 | 25 | 50 | 75 | 100 | 1000 | 2500
  ) => {
    props.updateSelectedPageSize(selected);
    props.getObjectsForward();
    props.setCurrentPage(1);
  };

  return (
    <Select
      defaultValue={100}
      style={{
        width: 120,
        marginLeft: 20,
      }}
      onChange={onPageSizeSelect}
      value={props.selectedPageSize}
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
