import { ClearOutlined } from "@ant-design/icons";
import { Button, Col, InputNumber, Row } from 'antd';
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const IntInput = ({ property, value, set, style }: TypeInputProps) => {
  const [_, setReset] = useState(0);

  const onChange = (value: number) => {
    if (property.type === "int" && !Number.isInteger(value)) {
      return;
    }
    set(value);
    setReset((v) => v + 1);
  };
  
  return (
    <Row align="middle" style={{ background: 'white'}}>
      <Col flex="auto">
      <InputNumber
        value={value}
        style={style}
        defaultValue={value}
        onChange={onChange}
        placeholder={property.optional && value === null ? "null" : undefined}
      />
      </Col>
      {property.optional ? (
        <Col>
            <Button
          icon={<ClearOutlined />}

          onClick={() => {
            set(null);
            setReset((v) => v + 1);
          }}
        >
          clear
        </Button>
        </Col>

      ) : null}
    </Row>
  );
};