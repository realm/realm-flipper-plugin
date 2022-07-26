import bigDecimal from 'js-big-decimal';
import { InputNumber } from "antd";
import React from "react";
import { TypeInputProps } from "./TypeInput";

export const DecimalInput = ({
  property,
  setter,
  value,
  inputReset,
  style
}: TypeInputProps) => {
  const onChange = (value: string) => {
    // console.log('onchange', value);
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
