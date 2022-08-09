import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, InputNumber, Row } from 'antd';
import bigDecimal from 'js-big-decimal';
import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';

export const DecimalInput = ({
  property,
  defaultValue,
  set,
  extraProps,
}: TypeInputProps) => {
  console.log('val:', defaultValue)
  const [value, setValue] = useState<bigDecimal | null>(defaultValue as bigDecimal | null);

  const onChange = (val: string) => {
    console.log('onChange', val);
    setValue(new bigDecimal(val));
    set(new bigDecimal(val));
  };

  return (
    <Row align="middle" style={{ background: 'white' }}>
      <Col flex="auto">
        <InputNumber
        {...extraProps}
          defaultValue={value?.getValue()}
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
