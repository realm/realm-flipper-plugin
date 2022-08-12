import { Pagination } from 'antd';
import React from 'react';

const DataPagination = (props: {
  totalObjects: number;
  selectedPageSize: 10 | 25 | 50 | 75 | 100 | 1000 | 2500;
  currentPage: number;
  setCurrentPage: (currentPage: number) => void;
  getObjects: (
    schema?: string | null,
    realm?: string | null,
    backwards?: boolean
  ) => void;
}) => {
  const getMore = (newSelectedPage: number) => {
    if (newSelectedPage > props.currentPage) {
      props.getObjects();
    } else {
      props.getObjects(null, null, true);
    }
    props.setCurrentPage(newSelectedPage);
  };
  return (
    <Pagination
      onChange={getMore}
      total={props.totalObjects}
      current={props.currentPage}
      pageSize={props.selectedPageSize}
      showSizeChanger={false}
      simple={true}
      hideOnSinglePage={true}
    />
  );
};

export default React.memo(DataPagination);
