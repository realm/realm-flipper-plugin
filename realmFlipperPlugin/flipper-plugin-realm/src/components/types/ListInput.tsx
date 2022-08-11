import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Row } from 'antd';
import { Layout } from 'flipper-plugin';
import React, { useState } from 'react';
import { getDefault, TypeInput, TypeInputProps } from './TypeInput';

export const ListInput = ({ property, set, defaultValue }: TypeInputProps) => {
  const [reset, setReset] = useState(0);
  const [array, setArray] = useState(defaultValue as unknown[]);
  console.log('rendering listinput', array);
  const typePointed = property.objectType;
  if (!typePointed) {
    return <></>;
  }
  const innerProp = {
    type: typePointed,
    name: '',
    indexed: false,
    mapTo: '',
    optional: false,
  };
  // console.log(array);
  return (
    <Layout.Container grow>
      {array.map((value: unknown, index: number) => {
        return (
          <Layout.Container
            grow
            key={index}
            style={{ backgroundColor: 'white' }}
          >
            <Row align="middle">
              <Col flex="auto">
                <TypeInput
                  extraProps={{ style: { width: '100%' } }}
                  property={innerProp}
                  set={(val) => {
                    const arr = array;
                    arr[index] = val;
                    setArray(arr);
                    set(arr);
                    setReset(v => v + 1);
                  }}
                  defaultValue={value}
                ></TypeInput>
              </Col>
              <Col>
                <Button
                  key={-index - 1}
                  type="primary"
                  icon={<DeleteOutlined />}
                  // size={"small"}
                  // remove ith element
                  onClick={() => {
                    setArray(array.filter((_, i) => i !== index));
                    set(array.filter((_, i) => i !== index));
                    setReset((v) => v + 1);
                  }}
                />
              </Col>
            </Row>
          </Layout.Container>
        );
      })}
      <Button onClick={() => setArray([...array, getDefault(innerProp)])}>
        Add {property.objectType}
      </Button>
    </Layout.Container>
  );
};
