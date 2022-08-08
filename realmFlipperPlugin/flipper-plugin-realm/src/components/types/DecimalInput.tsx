import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, InputNumber, Row } from 'antd';
import bigDecimal from 'js-big-decimal';
import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';

export const DecimalInput = ({
  property,
  value,
  set,
  style,
}: TypeInputProps) => {
  const [reset, setReset] = useState(0);

  const onChange = (value: string) => {
    set(new bigDecimal(value));
  };

  return (
    <Row align="middle" style={{ background: 'white' }}>
      <Col flex="auto">
        <InputNumber
          key={reset}
          style={style}
          defaultValue={value}
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
              setReset((v) => v + 1);
            }}
          ></Button>
        </Col>
      ) : null}
    </Row>
  );
};
