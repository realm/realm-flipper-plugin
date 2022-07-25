import { InputNumber } from "antd";
import React from "react";
import { TypeInputProps } from "./CommonInput";


export const IntInput =  ({ property, setter, value, inputReset }: TypeInputProps) => {
    const onChange = (value: number) => {
        if (property.type === 'int' && !Number.isInteger(value)) {
            return;
        }
        setter(value);
    }
    return (
        <InputNumber
        key={inputReset} defaultValue={value}
        style={{width: '100%'}}
        onChange={onChange}
        placeholder={property.optional ? "null" : undefined}
        />
    )
};
