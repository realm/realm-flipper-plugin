import bigDecimal from 'js-big-decimal';
import { InputNumber } from "antd";
import React from "react";
import { TypeInputProps } from "./CommonInput";

export const DecimalInput = ({
  property,
  setter,
  value,
  inputReset,
  style
}: TypeInputProps) => {
  const onChange = (value: string) => {
    setter(new bigDecimal(value));
  };
  return (
    <InputNumber
    style={style}
      key={inputReset}
      defaultValue={value}
      onChange={onChange}
      placeholder={property.optional ? "null" : undefined}
      stringMode
    />
  );
};
