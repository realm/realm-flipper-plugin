import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Row } from 'antd';
import moment from 'moment';
import React, { useState } from 'react';
import { TypeInputProps } from './TypeInput';

export const DateInput = ({ property, value, set, style }: TypeInputProps) => {
  const [reset, setReset] = useState(0);

  const onChange = (value: moment.Moment | null, dateString: string) => {
    set(value ? value?.toDate() : null);
  };

  return (
    <Row align="middle" style={{ background: 'white' }}>
      <Col flex="auto">
        <DatePicker
          style={style}
          defaultValue={value}
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
              setReset((v) => v + 1);
            }}
            icon={<ClearOutlined />}
          ></Button>
        </Col>
      ) : null}
    </Row>
  );
};
