import { Radio, RadioChangeEvent, Input, Button } from "antd";
import { TypeInputProps } from "./TypeInput";
import React, { useState } from "react";

export const DataInput = ({ property, set, value }: TypeInputProps) => {
  const [_, setReset] = useState(0);

  return (
    <Input.Group>
     
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
