import { Radio, RadioChangeEvent, Input, Button } from "antd";
import { TypeInputProps } from "./TypeInput";
import React from "react";

export const BoolInput = ({ property, setter, value, inputReset }: TypeInputProps) => {
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
    setter(value === 'True')
  };
  return (
    <Input.Group>
        <Radio.Group
        key={inputReset}
        defaultValue={value ? "True" : "False"}
        style={{ width: "100%" }}
        options={options}
        onChange={onChange}
        optionType="button"
      />
      {property.optional ? (
        <Button size="small" onClick={() => setter(null)}>
          clear
        </Button>
      ) : null}
    </Input.Group>

  );
};
