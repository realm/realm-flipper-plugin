import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, InputNumber, Row } from 'antd';
import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';

export const IntInput = ({
  property,
  defaultValue,
  set,
  extraProps,
  isPrimary,
}: TypeInputProps) => {
  const [_, setReset] = useState(0);
  const [value, setValue] = useState<number | null>(
    defaultValue === undefined ? null : (defaultValue as number)
  );

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
            disabled={isPrimary}
            value={value === null ? undefined : value}
            defaultValue={value === null ? undefined : value}
            onChange={onChange}
            placeholder={
              property.optional && value === null ? 'null' : undefined
            }
          />
      </Col>
      {property.optional ? (
        <Col>
          <Button
            disabled={isPrimary}
            icon={<ClearOutlined />}
            onClick={() => {
              set(null);
              setValue(null);
              setReset((v) => v + 1);
            }}
          ></Button>
        </Col>
      ) : null}
    </Row>
  );
};
