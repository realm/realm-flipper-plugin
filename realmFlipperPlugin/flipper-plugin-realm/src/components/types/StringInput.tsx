import { Button, Input } from "antd";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const StringInput = ({
  property,
  setter,
  value,
  inputReset,
  style,
  refresh,
}: TypeInputProps) => {
  //   const [reseter, setReseter] = useState(0);
  return (
    <Input.Group>
      <Input
        key={inputReset}
        placeholder={property.optional ? "null" : undefined}
        defaultValue={value}
        style={style}
        // value={value}
        onChange={(v) => {
          // console.log()
          // user change vs clear button
          if (v.type == "change") setter(v.target.value);
          else setter(null);
        }}
        // allowClear={property.optional}
      />
      {property.optional ? (
        <Button
          size="small"
          onClick={() => {
            refresh();
            setter(null)
          }}
        >
          clear
        </Button>
      ) : null}
    </Input.Group>
  );
};
