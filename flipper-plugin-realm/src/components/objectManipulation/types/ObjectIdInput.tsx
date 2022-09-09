import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';
import { ObjectId } from 'bson';
import { Button, Col, Input, Row } from 'antd';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';

export const ObjectIdInput = ({
  property,
  defaultValue,
  set,
  extraProps,
  isPrimary
}: TypeInputProps) => {
  const [_, setReset] = useState(0);
  const [value, setValue] = useState<string | null>(defaultValue !== null ? (defaultValue as ObjectId).toString() : null);

  const onChange = (value: string) => {
    setValue(value);
    if (ObjectId.isValid(value)) {
      set(new ObjectId(value));
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
          disabled={isPrimary}
          onChange={(v) => onChange(v.target.value)}
          placeholder={property.optional ? 'null' : undefined}
          status={
            (value === null && property.optional) ||
            (value !== null && ObjectId.isValid(value))
              ? ''
              : 'error'
          }
        />
      </Col>
      <Col>
        <Button
          disabled={isPrimary}
          onClick={() => {
            const newVal = new ObjectId();
            setValue(newVal.toString());
            set(newVal);
            setReset((v) => v + 1);
          }}
          icon={<ReloadOutlined />}
        ></Button>
        {property.optional ? (
          <Button
            disabled={isPrimary}
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
