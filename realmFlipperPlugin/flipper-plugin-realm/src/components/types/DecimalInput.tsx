import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, InputNumber, Row } from 'antd';
import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';

export const DecimalInput = ({
  property,
  defaultValue,
  set,
  extraProps,
}: TypeInputProps) => {
  const [value, setValue] = useState<string | null>(defaultValue as string | null);

  const onChange = (val: string) => {
    setValue(val);
    set(val);
  };

  return (
    <Row align="middle" style={{ background: 'white' }}>
      <Col flex="auto">
        <InputNumber
        {...extraProps}
          defaultValue={value === null ? undefined : value}
          onChange={onChange}
          placeholder={property.optional ? 'null' : undefined}
          stringMode
        />
      </Col>

      {property.optional ? (
        <Col>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              set(null);
              setValue(null);
            }}
          ></Button>
        </Col>
      ) : null}
    </Row>
  );
};
