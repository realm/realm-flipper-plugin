import { ArrowRightOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Row } from 'antd';
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

export const DictionaryInput = ({ set, isPrimary }: TypeInputProps) => {
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
    <Row gutter={[2, 4]}>
      {Array.from(contents.values()).map(
        (value: [string, unknown], index: number) => {
          return (
            <Row key={index} style={{ width: '97%' }} align="middle">
              <Col span={9}>
                <StringInput
                  isPrimary={isPrimary}
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
              <Col span={13}>
                <MixedInput
                  isPrimary={isPrimary}
                  key={index + resetOffset}
                  property={keyProperty}
                  set={(val: any) => {
                    contents.set(index, [value[0], val]);
                    setContents(contents);
                    set(mapToObj(contents));
                  }}
                ></MixedInput>
              </Col>
              <Col span={1}>
                <Button
                  disabled={isPrimary}
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setResetOffset((v) => v + contents.size);
                    contents.delete(index);
                  }}
                ></Button>
              </Col>
            </Row>
          );
        }
      )}
      <Button
        disabled={isPrimary}
        onClick={() => {
          contents.set(contents.size, ['key' + contents.size, null]);
          setContents(contents);
          set(mapToObj(contents));
          // setReset((v) => v + 1);
        }}
        style={{ width: '100%' }}
      >
        Add new
      </Button>
    </Row>
  );
};
