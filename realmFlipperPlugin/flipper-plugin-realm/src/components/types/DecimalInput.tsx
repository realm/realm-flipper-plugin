import bigDecimal from 'js-big-decimal';
import { InputNumber } from "antd";
import React from "react";
import { TypeInputProps } from "./CommonInput";

export const DecimalInput = ({
  property,
  setter,
  value,
  inputReset,
}: TypeInputProps) => {
  const onChange = (value: string) => {
    setter(new bigDecimal(value));
  };
  return (
    <InputNumber
      key={inputReset}
      defaultValue={value}
      style={{ width: "100%" }}
      onChange={onChange}
      placeholder={property.optional ? "null" : undefined}
      stringMode
    />
  );
};
