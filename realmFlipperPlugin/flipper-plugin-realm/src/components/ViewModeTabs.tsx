import {
  ConsoleSqlOutlined,
  SettingOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { Radio, Typography } from 'antd';
import { Toolbar } from 'flipper-plugin';
import React from 'react';

const ViewModeTabs = (props: {
  setViewMode: (viewMode: 'data' | 'schemas' | 'RQL') => void;
  viewMode: 'data' | 'schemas' | 'RQL';
}) => {
  return (
    <Toolbar position="top">
      <Radio.Group value={props.viewMode}>
        <Radio.Button value="data" onClick={() => props.setViewMode('data')}>
          <TableOutlined style={{ marginRight: 5 }} />
          <Typography.Text>Data</Typography.Text>
        </Radio.Button>
        <Radio.Button
          onClick={() => props.setViewMode('schemas')}
          value="schemas"
        >
          <SettingOutlined style={{ marginRight: 5 }} />
          <Typography.Text>Schema</Typography.Text>
        </Radio.Button>
        <Radio.Button onClick={() => props.setViewMode('RQL')} value="RQL">
          <ConsoleSqlOutlined style={{ marginRight: 5 }} />
          <Typography.Text>RQL</Typography.Text>
        </Radio.Button>
      </Radio.Group>
    </Toolbar>
  );
};

export default ViewModeTabs;
