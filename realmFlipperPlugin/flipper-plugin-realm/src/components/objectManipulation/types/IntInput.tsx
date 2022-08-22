import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, InputNumber, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { TypeInputProps } from './TypeInput';

export const IntInput = ({
  property,
  defaultValue,
  set,
  extraProps,
}: TypeInputProps) => {
  const [_, setReset] = useState(0);
  const [value, setValue] = useState<number | null>(defaultValue === undefined ? null : defaultValue as number);
  
  // useEffect(() => {
  //   setValue(defaultValue as number);
  // }, [defaultValue]);

  console.log('rendering intinput, value:', value)
  const onChange = (value: number) => {
    if (property.type === 'int' && !Number.isInteger(value)) {
      return;
    }
    set(value);
    setValue(value);
    setReset((v) => v + 1);
  };

  return (
    <Row align="middle">
      <Col flex="auto">
        <InputNumber
          {...extraProps}
          value={value === null ? undefined : value}
          defaultValue={value === null ? undefined : value}
          onChange={onChange}
          placeholder={property.optional && value === null ? 'null' : undefined}
        />
      </Col>
      {property.optional ? (
        <Col>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              set(null);
              setValue(null);
              setReset((v) => v + 1);
            }}
          >
          </Button>
        </Col>
      ) : null}
    </Row>
  );
};
