import { Button, Input } from "antd";
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
    <Input.Group>
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
      {property.optional ? (
        <Button
          size="small"
          onClick={() => {
            // refresh();
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