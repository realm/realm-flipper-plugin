import { Input } from 'antd';
import React from 'react';
import { TypeInputProps } from './CommonInput';

export const StringInput = ({
    property,
    values,
    inputReset
}: TypeInputProps) => {
    return (
        <Input
        key={inputReset}
        placeholder={property.optional ? "null" : undefined}
        defaultValue={values[property.name]}
        onChange={(v) => {
            // user change vs clear button
            if (v.type == 'change')
                values[property.name] = v.target.value 
            else
                values[property.name] = null
            }}
        allowClear={property.optional}
        />
    )
}