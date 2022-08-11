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
}: TypeInputProps) => {
  // console.log('dateInput', property, defaultValue, set, extraProps)
  const [reset, setReset] = useState(0);
  const [value, setValue] = useState<Date | null>(defaultValue as Date | null);

  const onChange = (value: moment.Moment | null) => {
    setValue(value ? value.toDate() : null);
    set(value ? value.toDate() : null);
  };

  return (
    <Row align="middle" style={{ backgroundColor: theme.backgroundDefault }}>
      <Col flex="auto">
        <DatePicker
          {...extraProps}
          defaultValue={moment(value)}
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
              setValue(null);
              setReset((v) => v + 1);
            }}
            icon={<ClearOutlined />}
          ></Button>
        </Col>
      ) : null}
    </Row>
  );
};
