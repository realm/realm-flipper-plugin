import { ArrowRightOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Row } from 'antd';
import React, { useState } from 'react';
import { StringInput } from './StringInput';
import { TypeInput, TypeInputProps } from './TypeInput';

const mapToObj = (map: Map<number, [string, any]>) => {
  const obj = new Object();
  map.forEach((val: [string, any]) => {
    obj[val[0] as keyof typeof obj] = val[1];
  });

  return obj;
};

export const DictionaryInput = ({ set, isPrimary, property }: TypeInputProps) => {
  const [contents, setContents] = useState(
    new Map<number, [string, unknown]>()
  );
  const [totalSize, setTotalSize] = useState(0);
  // const [resetOffset, setResetOffset] = useState(0);

  return (
    <Row gutter={[2, 4]}>
      {Array.from(contents.entries()).map(
        (val: [number, [string, unknown]]) => {
          const value = val[1];
          return (
            <Row key={val[0]} style={{ width: '97%' }} align="middle">
              <Col span={9}>
                <StringInput
                  isPrimary={isPrimary}
                  defaultValue={value[0]}
                  set={(val: any) => {
                    const realValue = contents.get(val[0]);
                    if (realValue === undefined) {
                      return;
                    }
                    contents.set(val[0], [val, realValue[1]]);
                    setContents(contents);
                    set(mapToObj(contents));
                  }}
                  property={{
                    type: 'string',
                    optional: false,
                  }}
                  key={val[0]}
                ></StringInput>
              </Col>
              <Col span={1}>
                <ArrowRightOutlined />
              </Col>
              <Col span={13}>
                <TypeInput
                  isPrimary={isPrimary}
                  key={val[0]}
                  property={{
                    type: property.objectType as string,
                    optional: property.optional,
                  }}
                  set={(val: any) => {
                    const stringKey = contents.get(val[0]);
                    if (!stringKey) {
                      return;
                    }
                    contents.set(val[0], [stringKey[0], val]);
                    // setContents(contents);
                    set(mapToObj(contents));
                  }}
                ></TypeInput>
              </Col>
              <Col span={1}>
                <Button
                  disabled={isPrimary}
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    contents.delete(val[0]);
                    setContents(contents);
                    set(mapToObj(contents));
                  }}
                ></Button>
              </Col>
            </Row>
          );
        }
      )}
      <Button
        disabled={isPrimary}
        onClick={() => {Ï
          contents.set(totalSize, ['key' + totalSize, null]);
          setContents(contents);
          set(mapToObj(contents));
          setTotalSize(v => v + 1);
        }}
        style={{ width: '100%' }}
      >
        Add new
      </Button>
    </Row>
  );
};
