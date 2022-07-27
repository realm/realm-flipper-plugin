import { Radio, RadioChangeEvent, Input, Button } from "antd";
import { TypeInputProps } from "./TypeInput";
import React, { useState } from "react";

export const BoolInput = ({ property, set, value }: TypeInputProps) => {
  const [_, setReset] = useState(0);

  const options = [
    {
      label: "True",
      value: "True",
    },
    {
      label: "False",
      value: "False",
    },
  ];
  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    set(value === "True");
  };
  return (
    <Input.Group>
      <Radio.Group
        defaultValue={value ? "True" : "False"}
        style={{ width: "100%" }}
        options={options}
        onChange={onChange}
        optionType="button"
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
