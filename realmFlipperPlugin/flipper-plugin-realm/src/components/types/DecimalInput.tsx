import bigDecimal from 'js-big-decimal';
import { InputNumber } from "antd";
import React from "react";
import { TypeInputProps } from "./CommonInput";

export const DecimalInput = ({
  property,
  values,
  inputReset,
}: TypeInputProps) => {
  const onChange = (value: string) => {
    values[property.name] = new bigDecimal(value);
  };
  return (
    <InputNumber
      key={inputReset}
      defaultValue={values[property.name]}
      style={{ width: "100%" }}
      onChange={onChange}
      placeholder={property.optional ? "null" : undefined}
      stringMode
    />
  );
};
