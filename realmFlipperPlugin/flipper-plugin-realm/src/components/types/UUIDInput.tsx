import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row } from 'antd';
import React, { useState } from 'react';
import uuid from 'react-native-uuid';
import { TypeInputProps } from './TypeInput';

export const UUIDInput = ({ property, value, set, style }: TypeInputProps) => {
  const [_, setReset] = useState(0);

  const onChange = (value: string) => {
    set(value);
  };
  // TODO handling invalid uuids?
  return (
    <Row align="middle" style={{ background: 'white' }}>
      <Col flex="auto">
        <Input
          value={value}
          style={style}
          onChange={(v) => onChange(v.target.value)}
          placeholder={property.optional ? 'null' : undefined}
          status={
            (value === null && property.optional) || uuid.validate(value)
              ? ''
              : 'error'
          }
        />
      </Col>
      <Col>
        <Button
          onClick={() => {
            set(uuid.v4());
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
