import { Button, Input } from "antd";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const StringInput = ({
  property,
  value,
  set,
  extraProps,
}: TypeInputProps) => {
  const [reset, setReset] = useState(0);

  return (
    <Input.Group>
      <Input
        key={reset}
        placeholder={property.optional ? "null" : undefined}
        defaultValue={value}
        {...extraProps}
        onChange={(v) => {
          // user change vs clear button
          if (v.type == "change") set(v.target.value);
          else set(null);
        }}
      />
      {property.optional ? (
        <Button
          size="small"
          onClick={() => {
            console.log('in clicker')
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
