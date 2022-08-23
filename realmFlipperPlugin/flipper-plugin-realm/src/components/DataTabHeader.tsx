import { Col, Row } from 'antd';
import React from 'react';
import { SchemaObject } from '../CommonTypes';
import { ObjectAdd } from './objectManipulation/ObjectAdd';
import { RealmQueryInput } from './Query';

type InputType = {
  currentSchema: SchemaObject;
};

export const DataTabHeader = ({ currentSchema }: InputType) => {
  return (
    <Row gutter={[8, 8]}>
      <ObjectAdd schema={currentSchema} />
      <Col span={24}>
        <RealmQueryInput
          execute={(query) => {
            console.log('supposed to execute query: ' + query);
            return undefined;
          }}
        />
      </Col>
    </Row>
  );
};
