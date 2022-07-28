import { InputNumber, Input, Button } from "antd";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const IntInput = ({ property, value, set, extraProps }: TypeInputProps) => {
  const [_, setReset] = useState(0);

  const onChange = (value: number) => {
    if (property.type === "int" && !Number.isInteger(value)) {
      return;
    }
    set(value);
  };
  return (
    <Input.Group>
      <InputNumber
        // value={value}
        {...extraProps}
        // key={inputReset}
        defaultValue={value}
        onChange={onChange}
        placeholder={property.optional ? "null" : undefined}
      />
      {property.optional ? (
        <Button
          size="small"
          onChange={() => {
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
