import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row } from 'antd';
import React, { useState } from 'react';
import uuid from 'react-native-uuid';
import { TypeInputProps } from './TypeInput';

export const UUIDInput = ({ property, defaultValue, set, extraProps }: TypeInputProps) => {
  const [_, setReset] = useState(0);
  const [value, setValue] = useState<string | null>(defaultValue as string);

  const onChange = (value: string) => {
    set(value);
  };

  return (
    <Row align="middle" style={{ background: 'white' }}>
      <Col flex="auto">
        <Input
          {...extraProps}
          value={value !== null ? value : undefined}
          onChange={(v) => onChange(v.target.value)}
          placeholder={property.optional ? 'null' : undefined}
          status={
            (value === null && property.optional) || (value !== null && uuid.validate(value))
              ? ''
              : 'error'
          }
        />
      </Col>
      <Col>
        <Button
          onClick={() => {
            const newVal = uuid.v4();
            set(newVal);
            setValue(newVal);
            setReset((v) => v + 1);
          }}
        >
          refresh
        </Button>
        {property.optional ? (
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              set(null);
              setReset((v) => v + 1);
            }}
          ></Button>
        ) : null}
      </Col>
    </Row>
  );
};
