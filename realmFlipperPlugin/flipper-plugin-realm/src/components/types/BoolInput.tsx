import { Radio, RadioChangeEvent } from "antd";
import { TypeInputProps } from "./CommonInput";
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
    <Radio.Group
      key={inputReset}
      defaultValue={value}
      style={{ width: "100%" }}
      options={options}
      onChange={onChange}
      optionType="button"
    />
  );
};
