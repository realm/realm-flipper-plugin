import { Radio, RadioChangeEvent } from "antd";
import { TypeInputProps } from "./CommonInput";
import React from "react";

export const BoolInput = ({ property, values, inputReset }: TypeInputProps) => {
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
    if (value === "True") {
      values[property.name] = true;
    } else {
      values[property.name] = false;
    }
  };
  return (
    <Radio.Group
      key={inputReset}
      style={{ width: "100%" }}
      options={options}
      onChange={onChange}
      optionType="button"
    />
  );
};
