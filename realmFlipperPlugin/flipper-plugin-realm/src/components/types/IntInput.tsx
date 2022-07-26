import { InputNumber } from "antd";
import React from "react";
import { TypeInputProps } from "./TypeInput";


export const IntInput =  ({ property, setter, value, inputReset, style }: TypeInputProps) => {
    const onChange = (value: number) => {
        if (property.type === 'int' && !Number.isInteger(value)) {
            return;
        }
        setter(value);
    }
    return (
        <InputNumber
        style={style}
        key={inputReset} defaultValue={value}
        onChange={onChange}
        placeholder={property.optional ? "null" : undefined}
        />
    )
};
