import {
  ArrowRightOutlined,
  DeleteColumnOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { Button, Col, Layout, Row } from 'antd';
import React, { useState } from 'react';
import { SchemaProperty } from '../../../CommonTypes';
import { MixedInput } from './MixedInput';
import { StringInput } from './StringInput';
import { TypeInputProps } from './TypeInput';

const mapToObj = (map: Map<number, [string, any]>) => {
  const obj = new Object();
  map.forEach((val: [string, any]) => {
    obj[val[0] as keyof typeof obj] = val[1];
  });

  return obj;
};

export const DictionaryInput = ({ set }: TypeInputProps) => {
  const [contents, setContents] = useState(
    new Map<number, [string, unknown]>()
  );
  // const [_, setReset] = useState(0);
  const [resetOffset, setResetOffset] = useState(0);
  const keyProperty: SchemaProperty = {
    name: '',
    type: 'string',
    indexed: false,
    optional: false,
    mapTo: '',
  };

  return (
    <Layout>
      {Array.from(contents.values()).map(
        (value: [string, unknown], index: number) => {
          return (
            <Row
              key={index}
              style={{ backgroundColor: 'white' }}
              align="middle"
            >
              <Col span={9}>
                <StringInput
                  defaultValue={value[0]}
                  set={(val: any) => {
                    contents.set(index, [val, value[1]]);
                    setContents(contents);
                    set(mapToObj(contents));
                  }}
                  property={keyProperty}
                  key={index + resetOffset}
                ></StringInput>
              </Col>
              <Col span={1}>
                <ArrowRightOutlined />
              </Col>
              <Col span={12}>
                <MixedInput
                  key={index + resetOffset}
                  property={keyProperty}
                  set={(val: any) => {
                    contents.set(index, [value[0], val]);
                    setContents(contents);
                    set(mapToObj(contents));
                    // setReset((v) => v + 1);
                  }}
                ></MixedInput>
              </Col>
              <Col span={1}>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setResetOffset(v => v + contents.size);
                    contents.delete(index);
                  }}
                ></Button>
              </Col>
            </Row>
          );
        }
      )}
      <Button
        onClick={() => {
          contents.set(contents.size, ['key' + contents.size, null]);
          setContents(contents);
          set(mapToObj(contents));
          setReset((v) => v + 1);
        }}
      >
        Add new
      </Button>
    </Layout>
  );
};