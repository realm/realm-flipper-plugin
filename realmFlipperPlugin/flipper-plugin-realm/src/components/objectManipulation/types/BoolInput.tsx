import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, Radio, RadioChangeEvent, Row } from 'antd';
import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';

export const BoolInput = ({ property, set, defaultValue }: TypeInputProps) => {
  const [value, setValue] = useState<boolean | null>(defaultValue as boolean | null);

  const options = [
    {
      label: 'True',
      value: 'True',
    },
    {
      label: 'False',
      value: 'False',
    },
  ];

  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    setValue(value === 'True')
    set(value === 'True');
  };

  return (
    <Row align="middle">
      <Col flex="auto">
        <Radio.Group
          options={options}
          onChange={onChange}
          optionType="button"
          value={value === null ? undefined : value ? 'True' : 'False'}
        />
      </Col>

      {property.optional ? (
        <Col>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              setValue(null);
              set(null);
            }}
          ></Button>
        </Col>
      ) : null}
    </Row>
  );
};
