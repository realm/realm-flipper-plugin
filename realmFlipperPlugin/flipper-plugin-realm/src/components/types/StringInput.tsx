import { ClearOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row } from "antd";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const StringInput = ({
  property,
  value,
  set,
  style,
}: TypeInputProps) => {
  const [reset, setReset] = useState(0);

  return (
    <Row align="middle" style={{ background: 'white'}}>
      <Col flex='auto'>
      <Input
        placeholder={property.optional && value === null ? "null" : undefined}
        defaultValue={value}
        style={style}
        onChange={(v) => {
          // user change vs clear button
          if (v.type == "change") set(v.target.value);
          else set(null);
        }}
        key={reset}
      />
      </Col>

      {property.optional ? (
        <Col>
        <Button
          icon={<ClearOutlined />}
          onClick={() => {
            // refresh();
            set(null);
            setReset((v) => v + 1);
          }}
        >
        </Button>
        </Col>
      ) : null}
    </Row>
  );
};