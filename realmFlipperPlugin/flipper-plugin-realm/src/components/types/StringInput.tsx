import { ClearOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row } from "antd";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const StringInput = ({
  property,
  defaultValue,
  set,
  extraProps,
}: TypeInputProps) => {
  const [value, setValue] = useState<string | null>(defaultValue as string | null);

  return (
    <Row align="middle" style={{ background: 'white'}}>
      <Col flex='auto'>
      <Input
        {...extraProps}
        placeholder={property.optional && value === null ? "null" : undefined}
        defaultValue={value !== null ? value : undefined}
        onChange={(v) => {
          // user change vs clear button
          if (v.type == "change") set(v.target.value);
          else set(null);
        }}
      />
      </Col>

      {property.optional ? (
        <Col>
        <Button
          icon={<ClearOutlined />}
          onClick={() => {
            // refresh();
            set(null);
            setValue(null);
          }}
        >
        </Button>
        </Col>
      ) : null}
    </Row>
  );
};