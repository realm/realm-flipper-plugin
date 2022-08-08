import { Layout } from 'flipper-plugin';
import React from 'react';
import DataPagination from './DataPagination';
import PageSizeSelect from './PageSizeSelect';

const PaginationGroup = () => {
  return (
    <Layout.Horizontal
      style={{
        paddingBottom: 10,
        paddingTop: 15,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <DataPagination />
      <PageSizeSelect />
    </Layout.Horizontal>
  );
};

export default React.memo(PaginationGroup);
