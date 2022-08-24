import { Col, Row } from 'antd';
import { usePlugin } from 'flipper-plugin';
import React from 'react';
import { plugin } from '..';
import { SchemaObject } from '../CommonTypes';
import { ObjectAdd } from './objectManipulation/ObjectAdd';
import { RealmQueryInput } from './Query';

type InputType = {
  currentSchema: SchemaObject;
};

export const DataTabHeader = ({ currentSchema }: InputType) => {
  const { executeQuery } = usePlugin(plugin);
  return (
    <Row gutter={[8, 8]}>
      <ObjectAdd schema={currentSchema} />
      <Col span={24}>
        <RealmQueryInput
          execute={executeQuery}
        />
      </Col>
    </Row>
  );
};
