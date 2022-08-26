import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Row } from 'antd';
import moment from 'moment';
import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';
import { theme } from 'flipper-plugin';

export const DateInput = ({
  property,
  defaultValue,
  set,
  extraProps,
  isPrimary
}: TypeInputProps) => {
  // console.log('dateInput', property, defaultValue, set, extraProps)
  console.log('defaultValue as Date:', defaultValue as Date);
  const [reset, setReset] = useState(0);
  const [value, setValue] = useState<Date | undefined>(defaultValue === null ? undefined : defaultValue as Date);

  const onChange = (value: moment.Moment | null) => {
    setValue(value ? value.toDate() : undefined);
    set(value ? value.toDate() : null);
  };

  return (
    <Row align="middle">
      <Col flex="auto">
        <DatePicker
          {...extraProps}
          disabled={isPrimary}
          defaultValue={value !== undefined ? moment(value) : undefined}
          format="DD-MM-YYYY HH:mm:ss.SSS"
          showTime={{ defaultValue: property.optional ? undefined : moment() }}
          onChange={onChange}
          allowClear={property.optional}
          key={reset}
        />
      </Col>

      {property.optional ? (
        <Col>
          <Button
            onClick={() => {
              set(null);
              setValue(undefined);
              setReset((v) => v + 1);
            }}
            icon={<ClearOutlined />}
          ></Button>
        </Col>
      ) : null}
    </Row>
  );
};
