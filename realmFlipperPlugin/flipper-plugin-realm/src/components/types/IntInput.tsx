import { InputNumber, Input, Button } from "antd";
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
    <Input.Group>
      <InputNumber
        value={value}
        style={style}
        defaultValue={value}
        onChange={onChange}
        placeholder={property.optional && value === null ? "null" : undefined}
      />
      {property.optional ? (
        <Button
          size="small"
          onClick={() => {
            set(null);
            setReset((v) => v + 1);
          }}
        >
          clear
        </Button>
      ) : null}
    </Input.Group>
  );
};
