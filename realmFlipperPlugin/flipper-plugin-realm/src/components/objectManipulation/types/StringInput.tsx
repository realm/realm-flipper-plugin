import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Row } from 'antd';
import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';

export const StringInput = ({
  property,
  defaultValue,
  set,
  extraProps,
  isPrimary,
}: TypeInputProps) => {
  const [value, setValue] = useState<string | null>(
    defaultValue as string | null
  );
  const [reset, setReset] = useState(0);
  console.log(isPrimary);
  return (
    <Row align="middle">
      <Col flex="auto">
        <Form.Item
          name={['string']}
          rules={[
            {
              pattern: new RegExp(/^[a-zA-Z@~`!@#$%^&*()_=+\\\\';:\"\\/?>.<,-]+$/i),
              message: 'Field only accepts letters',
            },
          ]}
        >
          <Input
            {...extraProps}
            disabled={isPrimary}
            placeholder={
              property.optional && value === null ? 'null' : undefined
            }
            defaultValue={value !== null ? value : undefined}
            onChange={(v) => {
              set(v.target.value);
              setValue(v.target.value);
            }}
            key={reset}
          />
        </Form.Item>
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
