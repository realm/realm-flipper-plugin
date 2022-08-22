import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row } from 'antd';
import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';
import { UUID } from 'bson';

export const UUIDInput = ({
  property,
  defaultValue,
  set,
  extraProps,
}: TypeInputProps) => {
  const [_, setReset] = useState(0);
  const [value, setValue] = useState<string | null>(
    defaultValue ? (defaultValue as UUID).toString() : null
  );

  const onChange = (value: string) => {
    setValue(value);
    if (UUID.isValid(value)) {
      set(new UUID(value));
    } else {
      set(null);
    }
  };

  return (
    <Row align="middle">
      <Col flex="auto">
        <Input
          {...extraProps}
          value={value !== null ? value : undefined}
          onChange={(v) => onChange(v.target.value)}
          placeholder={property.optional ? 'null' : undefined}
          status={
            (value === null && property.optional) ||
            (value !== null && UUID.isValid(value))
              ? ''
              : 'error'
          }
        />
      </Col>
      <Col>
        <Button
          onClick={() => {
            const newVal = new UUID();
            setValue(newVal.toString());
            set(newVal);
            setReset((v) => v + 1);
          }}
          icon={<ReloadOutlined />}
        >
        </Button>
        {property.optional ? (
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              set(null);
              setValue(null);
              setReset((v) => v + 1);
            }}
          ></Button>
        ) : null}
      </Col>
    </Row>
  );
};
