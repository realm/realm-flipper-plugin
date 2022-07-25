import { InputNumber } from "antd";
import React from "react";
import { TypeInputProps } from "./CommonInput";


export const IntInput =  ({ property, values, inputReset }: TypeInputProps) => {
    const onChange = (value: number) => {
        if (property.type === 'int' && !Number.isInteger(value)) {
            return;
        }
        values[property.name] = value
    }
    return (
        <InputNumber
        key={inputReset} defaultValue={values[property.name]}
        style={{width: '100%'}}
        onChange={onChange}
        placeholder={property.optional ? "null" : undefined}
        />
    )
};
