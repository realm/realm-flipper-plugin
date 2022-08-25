import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, Input, Row } from 'antd';
import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';

export const StringInput = ({
  property,
  defaultValue,
  set,
  extraProps,
}: TypeInputProps) => {
  const [value, setValue] = useState<string | null>(
    defaultValue as string | null
  );
  const [reset, setReset] = useState(0);

  return (
    <Row align="middle">
      <Col flex="auto">
        <Input
          {...extraProps}
          placeholder={property.optional && value === null ? 'null' : undefined}
          defaultValue={value !== null ? value : undefined}
          onChange={(v) => {
            set(v.target.value);
            setValue(v.target.value);
          }}
          key={reset}
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
          ></Button>
        </Col>
      ) : null}
    </Row>
  );
};
