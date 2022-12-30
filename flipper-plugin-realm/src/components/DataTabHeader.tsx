import { Col, Row, Typography } from 'antd';
import { usePlugin } from 'flipper-plugin';
import React from 'react';
import { plugin } from '..';
import { SortedObjectSchema } from '../CommonTypes';
import { ObjectAdd } from './objectManipulation/ObjectAdd';
import { RealmQueryInput } from './Query';

type InputType = {
  currentSchema: SortedObjectSchema;
  totalObjects: number;
};

export const DataTabHeader = ({ currentSchema, totalObjects }: InputType) => {
  const { executeQuery } = usePlugin(plugin);
  return (
    <Row gutter={[8, 8]}>
      <Col span={24}>
        <RealmQueryInput execute={executeQuery} />
      </Col>
      {currentSchema ?<Typography.Text
        style={{
          padding: 10,
          paddingLeft: 20,
          fontWeight: 500,
          color: '#70757a',
        }}
      >
        {totalObjects} {currentSchema.name} objects
      </Typography.Text> : null}
      <ObjectAdd schema={currentSchema} />
    </Row>
  );
};
