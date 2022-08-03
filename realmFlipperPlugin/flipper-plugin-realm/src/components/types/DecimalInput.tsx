import bigDecimal from "js-big-decimal";
import { Input, InputNumber, Button } from "antd";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const DecimalInput = ({
  property,
  value,
  set,
  style,
}: TypeInputProps) => {
  const [reset, setReset] = useState(0);

  const onChange = (value: string) => {
    set(new bigDecimal(value));
  };

  return (
    <Input.Group>
      <InputNumber
        key={reset}
        style={style}
        defaultValue={value}
        onChange={onChange}
        placeholder={property.optional ? "null" : undefined}
        stringMode
      />
      {property.optional ? (
        <Button
          size="small"
          onClick={() => {
            set(null);
            setReset(v => v + 1);
          }}
        >
          clear
        </Button>
      ) : null}
    </Input.Group>
  );
};