import { Button, Input } from "antd";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";
import uuid from "react-native-uuid";

export const UUIDInput = ({ property, value, set, style }: TypeInputProps) => {
  const [_, setReset] = useState(0);

  const onChange = (value: string) => {
    set(value);
  };
  // TODO handling invalid uuids?
  return (
    <Input.Group>
      <Input
        value={value}
        style={style}
        onChange={(v) => onChange(v.target.value)}
        placeholder={property.optional ? "null" : undefined}
        allowClear={property.optional}
        status={uuid.validate(value) ? "" : "error"}
      />
      <Button
        onClick={() => {
          set(uuid.v4());
          setReset((v) => v + 1);
        }}
      >
        refresh
      </Button>
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
